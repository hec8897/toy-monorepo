import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '@/supabase/supabase.service';

import { ConceptResponseDto } from './dto/concept-response.dto';
import { UserConceptResponseDto } from './dto/user-concept-response.dto';

@Injectable()
export class ConceptsService {
  constructor(private readonly supabase: SupabaseService) {}

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
}
