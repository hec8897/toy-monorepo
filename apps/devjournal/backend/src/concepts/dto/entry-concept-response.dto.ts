import type { Database } from '../../supabase/database.types';

type ConceptRow = Database['public']['Tables']['concepts']['Row'];

export type EntryConceptResponseDto = Omit<ConceptRow, 'embedding'> & {
  confidence: number;
};
