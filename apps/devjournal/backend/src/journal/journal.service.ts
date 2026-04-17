import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { AgentService } from '@/agent/agent.service';
import { ConceptsService } from '@/concepts/concepts.service';
import { SupabaseService } from '@/supabase/supabase.service';

import { CreateEntryDto } from './dto/create-entry.dto';
import { EntryResponseDto } from './dto/entry-response.dto';

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly agentService: AgentService,
    private readonly conceptsService: ConceptsService,
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

    // fire-and-forget: 응답 반환 후 백그라운드에서 분석 파이프라인 실행
    void this.triggerAnalysis(data.id, userId, dto.content);

    return rest;
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
      const { concepts, entry_summary } =
        await this.agentService.extractConcepts(content);

      await this.conceptsService.upsertBatch(entryId, userId, concepts);

      await this.supabase.admin
        .from('entries')
        .update({
          analysis_status: 'completed',
          analyzed_at: new Date().toISOString(),
          summary: entry_summary,
        })
        .eq('id', entryId);

      this.logger.log(
        `분석 완료: entryId=${entryId}, concepts=${concepts.length}개`,
      );
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
    }
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
}
