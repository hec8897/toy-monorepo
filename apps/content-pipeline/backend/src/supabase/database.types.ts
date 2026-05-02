// Phase 1 placeholder — content-pipeline 전용 Supabase 프로젝트는 빈 상태에서 시작.
// Phase 2에서 첫 도메인 테이블 추가 후 `supabase gen types typescript` 로 재생성.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
