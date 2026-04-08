import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '@/supabase/supabase.service';

import { CreateEntryDto } from './dto/create-entry.dto';
import { EntryResponseDto } from './dto/entry-response.dto';

@Injectable()
export class JournalService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(userId: string): Promise<EntryResponseDto[]> {
    const { data, error } = await this.supabase.anon
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []).map(
      ({ embedding: _e, deleted_at: _d, ...rest }) => rest,
    );
  }

  async findOne(userId: string, id: string): Promise<EntryResponseDto> {
    const { data, error } = await this.supabase.anon
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

    const { embedding: _e, deleted_at: _d, ...rest } = data;
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

    const { embedding: _e, deleted_at: _d, ...rest } = data;
    return rest;
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
