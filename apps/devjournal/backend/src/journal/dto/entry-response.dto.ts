import type { Database } from '../../supabase/database.types';

type EntryRow = Database['public']['Tables']['entries']['Row'];

export type EntryResponseDto = Omit<EntryRow, 'embedding' | 'deleted_at'>;
