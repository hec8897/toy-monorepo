import { Injectable, Logger } from '@nestjs/common';

import type { ConceptConnection } from '@devjournal/types';

import { SupabaseService } from '@/supabase/supabase.service';

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async upsertBatch(connections: ConceptConnection[]): Promise<void> {
    if (connections.length === 0) return;

    // concept 이름으로 ID 조회
    const allNames = [
      ...new Set(connections.flatMap((c) => [c.from_concept, c.to_concept])),
    ];
    const nameLowers = allNames.map((n) => n.toLowerCase());

    const { data: conceptRows, error: fetchError } = await this.supabase.admin
      .from('concepts')
      .select('id, name_lower')
      .in('name_lower', nameLowers);

    if (fetchError) {
      this.logger.warn(`Failed to fetch concept IDs: ${fetchError.message}`);
      return;
    }

    const idByName = new Map(
      (conceptRows ?? []).map((c) => [c.name_lower, c.id]),
    );

    const rows = connections
      .map((conn) => {
        const fromId = idByName.get(conn.from_concept.toLowerCase());
        const toId = idByName.get(conn.to_concept.toLowerCase());
        if (!fromId || !toId || fromId === toId) return null;
        return {
          from_id: fromId,
          to_id: toId,
          strength: conn.strength,
          relation_type: conn.relation_type,
          created_by: 'ai' as const,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) return;

    const { error } = await this.supabase.admin
      .from('connections')
      .upsert(rows, { onConflict: 'from_id,to_id', ignoreDuplicates: true });

    if (error) {
      this.logger.warn(`Failed to upsert connections: ${error.message}`);
    } else {
      this.logger.log(`upsertBatch done — ${rows.length}개 연결 저장`);
    }
  }

  async findByConceptIds(conceptIds: string[]): Promise<
    {
      from_id: string;
      to_id: string;
      strength: number;
      relation_type: string;
    }[]
  > {
    if (conceptIds.length === 0) return [];

    const { data, error } = await this.supabase.admin
      .from('connections')
      .select('from_id, to_id, strength, relation_type')
      .in('from_id', conceptIds)
      .in('to_id', conceptIds);

    if (error) {
      this.logger.warn(`Failed to fetch connections: ${error.message}`);
      return [];
    }

    return data ?? [];
  }
}
