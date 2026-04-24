import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

import type { SSEEventType } from '@devjournal/types';

import { AgentService } from '@/agent/agent.service';
import { ConceptsService } from '@/concepts/concepts.service';
import { ConnectionsService } from '@/connections/connections.service';
import { SupabaseService } from '@/supabase/supabase.service';

import { CreateEntryDto } from './dto/create-entry.dto';
import { EntryResponseDto } from './dto/entry-response.dto';

/** NestJS @Sse 응답 형식 */
interface MessageEvent {
  data: string;
  type?: string;
  id?: string;
  retry?: number;
}

/** Subject TTL: 30분 (분석 완료 후 연결을 늦게 시도하는 클라이언트 대비) */
const SUBJECT_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name);

  /** entryId → Subject 맵. triggerAnalysis 시작 시 생성, 완료/실패 시 제거 */
  private readonly analysisSubjects = new Map<string, Subject<MessageEvent>>();
  /** Subject TTL 타이머 맵 */
  private readonly subjectTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(
    private readonly supabase: SupabaseService,
    private readonly agentService: AgentService,
    private readonly conceptsService: ConceptsService,
    private readonly connectionsService: ConnectionsService,
  ) {}

  async findAll(userId: string): Promise<EntryResponseDto[]> {
    const { data, error } = await this.supabase.admin
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ embedding, deleted_at, ...rest }) => rest,
    );
  }

  async findOne(userId: string, id: string): Promise<EntryResponseDto> {
    const { data, error } = await this.supabase.admin
      .from('entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException(`Entry #${id} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { embedding, deleted_at, ...rest } = data;
    return rest;
  }

  async create(userId: string, dto: CreateEntryDto): Promise<EntryResponseDto> {
    const { data, error } = await this.supabase.admin
      .from('entries')
      .insert({
        user_id: userId,
        content: dto.content,
        title: dto.title ?? null,
        analysis_status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new InternalServerErrorException('Failed to create entry');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { embedding, deleted_at, ...rest } = data;

    // Subject 미리 생성해 두어야 클라이언트가 SSE 연결 전에 분석이 시작돼도 이벤트 수신 가능
    this.createSubject(data.id);

    // fire-and-forget
    void this.triggerAnalysis(data.id, userId, dto.content);

    return rest;
  }

  /**
   * SSE 스트림 반환.
   * - 분석 완료/실패 상태면 즉시 완료 이벤트를 emit하고 complete.
   * - 분석 진행 중이면 Subject Observable 반환.
   */
  async getAnalysisStream(
    entryId: string,
    userId: string,
  ): Promise<Observable<MessageEvent>> {
    // 소유권 확인
    const { data: entry, error } = await this.supabase.admin
      .from('entries')
      .select('id, analysis_status, analysis_error')
      .eq('id', entryId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !entry) {
      throw new NotFoundException(`Entry #${entryId} not found`);
    }

    // 이미 완료된 경우: 즉시 완료 이벤트를 emit하는 one-shot Observable
    if (entry.analysis_status === 'completed') {
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next(
          this.buildEvent('analysis_complete', { success: true }),
        );
        subscriber.complete();
      });
    }

    if (entry.analysis_status === 'failed') {
      return new Observable<MessageEvent>((subscriber) => {
        subscriber.next(
          this.buildEvent('error', {
            message: entry.analysis_error ?? '분석 실패',
          }),
        );
        subscriber.complete();
      });
    }

    // pending/processing: Subject 반환 (없으면 새로 생성)
    if (!this.analysisSubjects.has(entryId)) {
      this.createSubject(entryId);
    }
    return this.analysisSubjects.get(entryId)!.asObservable();
  }

  async remove(userId: string, id: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from('entries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // ─── 내부 메서드 ─────────────────────────────────────────────────────────────

  private createSubject(entryId: string): Subject<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    this.analysisSubjects.set(entryId, subject);

    // TTL 만료 시 강제 종료
    const timer = setTimeout(() => {
      this.cleanupSubject(entryId);
    }, SUBJECT_TTL_MS);
    this.subjectTimers.set(entryId, timer);

    return subject;
  }

  private cleanupSubject(entryId: string): void {
    const subject = this.analysisSubjects.get(entryId);
    if (subject) {
      subject.complete();
      this.analysisSubjects.delete(entryId);
    }
    const timer = this.subjectTimers.get(entryId);
    if (timer) {
      clearTimeout(timer);
      this.subjectTimers.delete(entryId);
    }
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    label: string,
    delayMs = 2000,
  ): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `[${label}] 실패 (${reason}), ${delayMs}ms 후 재시도...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fn();
    }
  }

  private emitSSE(entryId: string, type: SSEEventType, data: object): void {
    const subject = this.analysisSubjects.get(entryId);
    subject?.next(this.buildEvent(type, data));
  }

  private buildEvent(type: SSEEventType, data: object): MessageEvent {
    return { type, data: JSON.stringify(data) };
  }

  private async triggerAnalysis(
    entryId: string,
    userId: string,
    content: string,
  ): Promise<void> {
    await this.supabase.admin
      .from('entries')
      .update({ analysis_status: 'processing' })
      .eq('id', entryId);

    try {
      // ── Step 1: 개념 추출 ──────────────────────────────────────────────────
      this.emitSSE(entryId, 'progress', {
        step: 1,
        message: '개념 추출 중...',
      });

      const { concepts, entry_summary } = await this.withRetry(
        () => this.agentService.extractConcepts(content),
        `Step1:${entryId}`,
      );

      await this.conceptsService.upsertBatch(entryId, userId, concepts);

      this.emitSSE(entryId, 'concepts_extracted', { concepts, entry_summary });
      this.logger.log(
        `[Step 1] 완료: entryId=${entryId}, concepts=${concepts.length}개`,
      );

      // ── Step 2: 연결 관계 분석 ─────────────────────────────────────────────
      this.emitSSE(entryId, 'progress', {
        step: 2,
        message: '연결 관계 분석 중...',
      });

      try {
        const conceptNames = concepts.map((c) => c.name);
        const candidates =
          await this.conceptsService.findCandidateConnections(conceptNames);

        const { connections } = await this.withRetry(
          () => this.agentService.searchConnections(conceptNames, candidates),
          `Step2:${entryId}`,
        );

        await this.connectionsService.upsertBatch(connections);
        this.emitSSE(entryId, 'connections_found', { connections });

        this.logger.log(
          `[Step 2] 완료: entryId=${entryId}, connections=${connections.length}개`,
        );
      } catch (stepErr) {
        // Step 2 실패해도 Step 1 결과는 유지, partial 완료로 처리
        this.logger.warn(
          `[Step 2] 실패 (partial): ${stepErr instanceof Error ? stepErr.message : String(stepErr)}`,
        );
        this.emitSSE(entryId, 'step_failed', { step: 2, will_retry: false });
      }

      // ── 완료 ──────────────────────────────────────────────────────────────
      await this.supabase.admin
        .from('entries')
        .update({
          analysis_status: 'completed',
          analyzed_at: new Date().toISOString(),
          summary: entry_summary,
        })
        .eq('id', entryId);

      this.emitSSE(entryId, 'analysis_complete', { success: true });
      this.logger.log(`분석 완료: entryId=${entryId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`분석 실패: entryId=${entryId}, error=${message}`);

      await this.supabase.admin
        .from('entries')
        .update({
          analysis_status: 'failed',
          analysis_error: message,
        })
        .eq('id', entryId);

      this.emitSSE(entryId, 'error', { message });
    } finally {
      this.cleanupSubject(entryId);
    }
  }
}
