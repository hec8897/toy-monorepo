import type { Database } from '../../supabase/database.types';

type UserConceptRow = Database['public']['Tables']['user_concepts']['Row'];
type ConceptRow = Database['public']['Tables']['concepts']['Row'];

export type UserConceptResponseDto = UserConceptRow & {
  concepts: Omit<ConceptRow, 'embedding'>;
};
