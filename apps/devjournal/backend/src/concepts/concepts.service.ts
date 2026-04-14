import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ConceptItem } from '@/agent/agent.service';
import { EmbeddingService } from '@/embedding/embedding.service';
import { SupabaseService } from '@/supabase/supabase.service';

import { ConceptResponseDto } from './dto/concept-response.dto';
import { UserConceptResponseDto } from './dto/user-concept-response.dto';

@Injectable()
export class ConceptsService {
  private readonly logger = new Logger(ConceptsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly embedding: EmbeddingService,
  ) {}

  async findAll(limit: number, offset: number): Promise<ConceptResponseDto[]> {
    const { data, error } = await this.supabase.admin
      .from('concepts')
      .select(
        'id, name, name_lower, category, description, aliases, source, usage_count, created_at, updated_at',
      )
      .order('usage_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }

  async findUserConcepts(userId: string): Promise<UserConceptResponseDto[]> {
    const { data, error } = await this.supabase.admin
      .from('user_concepts')
      .select(
        'concept_id, user_id, learned_at, mastery_level, ease_factor, review_count, last_reviewed_at, next_review_at, concepts(id, name, name_lower, category, description, aliases, source, usage_count, created_at, updated_at)',
      )
      .eq('user_id', userId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []) as unknown as UserConceptResponseDto[];
  }

  async search(query: string): Promise<ConceptResponseDto[]> {
    const { data, error } = await this.supabase.admin
      .from('concepts')
      .select(
        'id, name, name_lower, category, description, aliases, source, usage_count, created_at, updated_at',
      )
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }

  async findOne(id: string): Promise<ConceptResponseDto> {
    const { data, error } = await this.supabase.admin
      .from('concepts')
      .select(
        'id, name, name_lower, category, description, aliases, source, usage_count, created_at, updated_at',
      )
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException(`Concept #${id} not found`);
    }

    return data;
  }

  async upsertBatch(
    entryId: string,
    userId: string,
    concepts: ConceptItem[],
  ): Promise<void> {
    if (concepts.length === 0) return;

    const nameLowers = concepts.map((c) => c.name.toLowerCase());

    // 1. 기존 개념 조회
    const { data: existing, error: fetchError } = await this.supabase.admin
      .from('concepts')
      .select('id, name_lower, aliases, usage_count')
      .in('name_lower', nameLowers);

    if (fetchError) {
      throw new InternalServerErrorException(fetchError.message);
    }

    const existingMap = new Map((existing ?? []).map((c) => [c.name_lower, c]));

    const newConcepts = concepts.filter(
      (c) => !existingMap.has(c.name.toLowerCase()),
    );
    const oldConcepts = concepts.filter((c) =>
      existingMap.has(c.name.toLowerCase()),
    );

    // 2. 신규 개념: embedding 생성 후 INSERT
    const insertedIds: string[] = [];
    for (const concept of newConcepts) {
      try {
        const vector = await this.embedding.embed(
          `${concept.name}: ${concept.description}`,
        );

        const { data: inserted, error: insertError } = await this.supabase.admin
          .from('concepts')
          .insert({
            name: concept.name,
            category: concept.category,
            description: concept.description,
            aliases: concept.aliases,
            embedding: `[${vector.join(',')}]`,
            source: 'ai_extracted',
            usage_count: 1,
          })
          .select('id')
          .single();

        if (insertError) {
          this.logger.warn(
            `Failed to insert concept "${concept.name}": ${insertError.message}`,
          );
          continue;
        }

        if (inserted) insertedIds.push(inserted.id);
        this.logger.log(`Inserted new concept: "${concept.name}"`);
      } catch (err) {
        this.logger.warn(
          `Error processing new concept "${concept.name}": ${err}`,
        );
      }
    }

    // 3. 기존 개념: usage_count 증가 + aliases 병합
    const updatedIds: string[] = [];
    for (const concept of oldConcepts) {
      const existing = existingMap.get(concept.name.toLowerCase());
      if (!existing) continue;

      try {
        const mergedAliases = [
          ...new Set([...(existing.aliases ?? []), ...concept.aliases]),
        ];

        const { error: updateError } = await this.supabase.admin
          .from('concepts')
          .update({
            usage_count: (existing.usage_count ?? 0) + 1,
            aliases: mergedAliases,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          this.logger.warn(
            `Failed to update concept "${concept.name}": ${updateError.message}`,
          );
          continue;
        }

        updatedIds.push(existing.id);
      } catch (err) {
        this.logger.warn(`Error updating concept "${concept.name}": ${err}`);
      }
    }

    const allConceptIds = [...insertedIds, ...updatedIds];
    if (allConceptIds.length === 0) return;

    // 4. entry_concepts INSERT (ON CONFLICT DO NOTHING)
    const conceptByNameLower = new Map(
      concepts.map((c) => [c.name.toLowerCase(), c]),
    );
    const idToNameLower = new Map<string, string>();
    for (const id of insertedIds) {
      // insertedIds 순서 = newConcepts 순서
      const idx = insertedIds.indexOf(id);
      idToNameLower.set(id, newConcepts[idx].name.toLowerCase());
    }
    for (const id of updatedIds) {
      const existing = [...existingMap.values()].find((e) => e.id === id);
      if (existing) idToNameLower.set(id, existing.name_lower);
    }

    const entryConceptRows = allConceptIds.map((conceptId) => {
      const nameLower = idToNameLower.get(conceptId) ?? '';
      const concept = conceptByNameLower.get(nameLower);
      return {
        entry_id: entryId,
        concept_id: conceptId,
        confidence: concept?.confidence ?? 0.6,
      };
    });

    const { error: entryConceptError } = await this.supabase.admin
      .from('entry_concepts')
      .upsert(entryConceptRows, {
        onConflict: 'entry_id,concept_id',
        ignoreDuplicates: true,
      });

    if (entryConceptError) {
      this.logger.warn(
        `Failed to insert entry_concepts: ${entryConceptError.message}`,
      );
    }

    // 5. user_concepts UPSERT (이미 학습 중인 개념은 skip)
    const userConceptRows = allConceptIds.map((conceptId) => ({
      user_id: userId,
      concept_id: conceptId,
      mastery_level: 'learning',
    }));

    const { error: userConceptError } = await this.supabase.admin
      .from('user_concepts')
      .upsert(userConceptRows, {
        onConflict: 'user_id,concept_id',
        ignoreDuplicates: true,
      });

    if (userConceptError) {
      this.logger.warn(
        `Failed to upsert user_concepts: ${userConceptError.message}`,
      );
    }

    this.logger.log(
      `upsertBatch done — new: ${insertedIds.length}, updated: ${updatedIds.length}, entry_concepts: ${entryConceptRows.length}`,
    );
  }
}
