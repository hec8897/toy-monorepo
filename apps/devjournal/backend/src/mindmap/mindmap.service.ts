import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '@/supabase/supabase.service';

import { ConceptDetailDto, EntryRefDto } from './dto/concept-detail.dto';
import {
  MasteryLevel,
  MindmapEdgeDto,
  MindmapGraphDto,
  MindmapNodeDto,
} from './dto/mindmap-graph.dto';

interface RawMindmapNode {
  id: string;
  name: string;
  category: string;
  mastery: string | null;
  review_count: number | null;
  is_recent: boolean | null;
}

interface RawMindmapEdge {
  from: string;
  to: string;
  strength: number | null;
  type: string | null;
}

interface RawMindmapResult {
  nodes: RawMindmapNode[] | null;
  edges: RawMindmapEdge[] | null;
}

const MASTERY_FALLBACK: MasteryLevel = 'learning';

const RELATED_ENTRIES_LIMIT = 10;

@Injectable()
export class MindmapService {
  private readonly logger = new Logger(MindmapService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async getUserMindmap(userId: string): Promise<MindmapGraphDto> {
    const { data, error } = await this.supabase.admin.rpc('get_user_mindmap', {
      p_user_id: userId,
    });

    if (error) {
      this.logger.error(
        `get_user_mindmap RPC failed: ${error.message}`,
        error.details ?? '',
      );
      throw new InternalServerErrorException(error.message);
    }

    return this.normalizeGraph(data as unknown as RawMindmapResult | null);
  }

  async getConceptDetail(
    userId: string,
    conceptId: string,
  ): Promise<ConceptDetailDto> {
    // 1. user_concepts (본인이 학습 중인 개념인지 + mastery / review_count)
    const { data: userConcept, error: userConceptError } =
      await this.supabase.admin
        .from('user_concepts')
        .select('mastery_level, review_count')
        .eq('user_id', userId)
        .eq('concept_id', conceptId)
        .maybeSingle();

    if (userConceptError) {
      throw new InternalServerErrorException(userConceptError.message);
    }
    if (!userConcept) {
      throw new NotFoundException(`Concept #${conceptId} not in your mindmap`);
    }

    // 2. concept (이름 / 카테고리 / 설명)
    const { data: concept, error: conceptError } = await this.supabase.admin
      .from('concepts')
      .select('id, name, category, description')
      .eq('id', conceptId)
      .single();

    if (conceptError || !concept) {
      throw new NotFoundException(`Concept #${conceptId} not found`);
    }

    // 3. 본인 일기 중 이 개념과 연결된 것 (최신 N개)
    const { data: entryRows, error: entryError } = await this.supabase.admin
      .from('entry_concepts')
      .select('entries!inner(id, title, created_at, user_id, deleted_at)')
      .eq('concept_id', conceptId)
      .eq('entries.user_id', userId)
      .is('entries.deleted_at', null)
      .order('created_at', {
        referencedTable: 'entries',
        ascending: false,
      })
      .limit(RELATED_ENTRIES_LIMIT);

    if (entryError) {
      throw new InternalServerErrorException(entryError.message);
    }

    const relatedEntries: EntryRefDto[] = (entryRows ?? []).map((row) => {
      const entry = row.entries as unknown as {
        id: string;
        title: string | null;
        created_at: string;
      };
      return {
        id: entry.id,
        title: entry.title,
        created_at: entry.created_at,
      };
    });

    return {
      id: concept.id,
      name: concept.name,
      category: concept.category,
      description: concept.description,
      mastery: this.coerceMastery(userConcept.mastery_level),
      review_count: userConcept.review_count ?? 0,
      related_entries: relatedEntries,
    };
  }

  private normalizeGraph(raw: RawMindmapResult | null): MindmapGraphDto {
    const nodes: MindmapNodeDto[] = (raw?.nodes ?? []).map((node) => ({
      id: node.id,
      name: node.name,
      category: node.category,
      mastery: this.coerceMastery(node.mastery),
      review_count: node.review_count ?? 0,
      is_recent: node.is_recent ?? false,
    }));

    const edges: MindmapEdgeDto[] = (raw?.edges ?? []).map((edge) => ({
      from: edge.from,
      to: edge.to,
      strength: edge.strength ?? 0.5,
      type: edge.type ?? 'is_related_to',
    }));

    return { nodes, edges };
  }

  private coerceMastery(value: string | null | undefined): MasteryLevel {
    if (value === 'familiar' || value === 'mastered' || value === 'learning') {
      return value;
    }
    return MASTERY_FALLBACK;
  }
}
