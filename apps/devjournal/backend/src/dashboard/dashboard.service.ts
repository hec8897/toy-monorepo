import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { SupabaseService } from '@/supabase/supabase.service';

import { ConceptGrowthPointDto } from './dto/concept-growth-response.dto';
import { HeatmapCellDto } from './dto/heatmap-response.dto';
import { KpisResponseDto } from './dto/kpis-response.dto';

interface RawConceptGrowthRow {
  date: string;
  cumulative: number;
}

interface RawHeatmapRow {
  date: string;
  count: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async getKpis(userId: string): Promise<KpisResponseDto> {
    const [entriesRes, conceptsRes, masteredRes, streakRes] = await Promise.all(
      [
        this.supabase.admin
          .from('entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .is('deleted_at', null),
        this.supabase.admin
          .from('user_concepts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        this.supabase.admin
          .from('user_concepts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('mastery_level', 'mastered'),
        this.supabase.admin.rpc('get_user_streak', { p_user_id: userId }),
      ],
    );

    if (entriesRes.error) {
      this.logger.error(
        `entries count failed: ${entriesRes.error.message}`,
        entriesRes.error.details ?? '',
      );
      throw new InternalServerErrorException(entriesRes.error.message);
    }
    if (conceptsRes.error) {
      this.logger.error(
        `user_concepts count failed: ${conceptsRes.error.message}`,
        conceptsRes.error.details ?? '',
      );
      throw new InternalServerErrorException(conceptsRes.error.message);
    }
    if (masteredRes.error) {
      this.logger.error(
        `mastered count failed: ${masteredRes.error.message}`,
        masteredRes.error.details ?? '',
      );
      throw new InternalServerErrorException(masteredRes.error.message);
    }
    if (streakRes.error) {
      this.logger.error(
        `get_user_streak RPC failed: ${streakRes.error.message}`,
        streakRes.error.details ?? '',
      );
      throw new InternalServerErrorException(streakRes.error.message);
    }

    return {
      totalEntries: entriesRes.count ?? 0,
      totalConcepts: conceptsRes.count ?? 0,
      masteredConcepts: masteredRes.count ?? 0,
      currentStreak: streakRes.data ?? 0,
    };
  }

  async getConceptGrowth(
    userId: string,
    days: number,
  ): Promise<ConceptGrowthPointDto[]> {
    const { data, error } = await this.supabase.admin.rpc(
      'get_concept_growth',
      {
        p_user_id: userId,
        p_days: days,
      },
    );

    if (error) {
      this.logger.error(
        `get_concept_growth RPC failed: ${error.message}`,
        error.details ?? '',
      );
      throw new InternalServerErrorException(error.message);
    }

    const rows = (data as unknown as RawConceptGrowthRow[] | null) ?? [];
    return rows.map((row) => ({
      date: row.date,
      cumulative: row.cumulative ?? 0,
    }));
  }

  async getEntryHeatmap(
    userId: string,
    days: number,
  ): Promise<HeatmapCellDto[]> {
    const { data, error } = await this.supabase.admin.rpc('get_entry_heatmap', {
      p_user_id: userId,
      p_days: days,
    });

    if (error) {
      this.logger.error(
        `get_entry_heatmap RPC failed: ${error.message}`,
        error.details ?? '',
      );
      throw new InternalServerErrorException(error.message);
    }

    const rows = (data as unknown as RawHeatmapRow[] | null) ?? [];
    return rows.map((row) => ({
      date: row.date,
      count: row.count ?? 0,
    }));
  }
}
