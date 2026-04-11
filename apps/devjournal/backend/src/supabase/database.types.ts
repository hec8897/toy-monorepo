export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      concepts: {
        Row: {
          aliases: string[] | null;
          category: string;
          created_at: string;
          description: string | null;
          embedding: string;
          id: string;
          name: string;
          name_lower: string | null;
          source: string | null;
          updated_at: string;
          usage_count: number;
        };
        Insert: {
          aliases?: string[] | null;
          category: string;
          created_at?: string;
          description?: string | null;
          embedding: string;
          id?: string;
          name: string;
          name_lower?: string | null;
          source?: string | null;
          updated_at?: string;
          usage_count?: number;
        };
        Update: {
          aliases?: string[] | null;
          category?: string;
          created_at?: string;
          description?: string | null;
          embedding?: string;
          id?: string;
          name?: string;
          name_lower?: string | null;
          source?: string | null;
          updated_at?: string;
          usage_count?: number;
        };
        Relationships: [];
      };
      connections: {
        Row: {
          created_by: string | null;
          from_id: string;
          relation_type: string;
          strength: number;
          to_id: string;
        };
        Insert: {
          created_by?: string | null;
          from_id: string;
          relation_type?: string;
          strength?: number;
          to_id: string;
        };
        Update: {
          created_by?: string | null;
          from_id?: string;
          relation_type?: string;
          strength?: number;
          to_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'connections_from_id_fkey';
            columns: ['from_id'];
            isOneToOne: false;
            referencedRelation: 'concepts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'connections_to_id_fkey';
            columns: ['to_id'];
            isOneToOne: false;
            referencedRelation: 'concepts';
            referencedColumns: ['id'];
          },
        ];
      };
      entries: {
        Row: {
          analysis_error: string | null;
          analysis_status: string;
          analyzed_at: string | null;
          content: string;
          created_at: string;
          deleted_at: string | null;
          embedding: string | null;
          id: string;
          is_published: boolean;
          published_at: string | null;
          seo_description: string | null;
          seo_tags: string[] | null;
          seo_title: string | null;
          slug: string | null;
          summary: string | null;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          analysis_error?: string | null;
          analysis_status?: string;
          analyzed_at?: string | null;
          content: string;
          created_at?: string;
          deleted_at?: string | null;
          embedding?: string | null;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          seo_description?: string | null;
          seo_tags?: string[] | null;
          seo_title?: string | null;
          slug?: string | null;
          summary?: string | null;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          analysis_error?: string | null;
          analysis_status?: string;
          analyzed_at?: string | null;
          content?: string;
          created_at?: string;
          deleted_at?: string | null;
          embedding?: string | null;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          seo_description?: string | null;
          seo_tags?: string[] | null;
          seo_title?: string | null;
          slug?: string | null;
          summary?: string | null;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      entry_concepts: {
        Row: {
          concept_id: string;
          confidence: number;
          entry_id: string;
        };
        Insert: {
          concept_id: string;
          confidence: number;
          entry_id: string;
        };
        Update: {
          concept_id?: string;
          confidence?: number;
          entry_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'entry_concepts_concept_id_fkey';
            columns: ['concept_id'];
            isOneToOne: false;
            referencedRelation: 'concepts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'entry_concepts_entry_id_fkey';
            columns: ['entry_id'];
            isOneToOne: false;
            referencedRelation: 'entries';
            referencedColumns: ['id'];
          },
        ];
      };
      user_concepts: {
        Row: {
          concept_id: string;
          ease_factor: number;
          last_reviewed_at: string | null;
          learned_at: string;
          mastery_level: string;
          next_review_at: string | null;
          review_count: number;
          user_id: string;
        };
        Insert: {
          concept_id?: string;
          ease_factor?: number;
          last_reviewed_at?: string | null;
          learned_at?: string;
          mastery_level?: string;
          next_review_at?: string | null;
          review_count?: number;
          user_id: string;
        };
        Update: {
          concept_id?: string;
          ease_factor?: number;
          last_reviewed_at?: string | null;
          learned_at?: string;
          mastery_level?: string;
          next_review_at?: string | null;
          review_count?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_concepts_concept_id_fkey';
            columns: ['concept_id'];
            isOneToOne: false;
            referencedRelation: 'concepts';
            referencedColumns: ['id'];
          },
        ];
      };
      user_profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          timezone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_mindmap: { Args: { p_user_id: string }; Returns: Json };
      match_concepts: {
        Args: {
          match_count?: number;
          match_threshold?: number;
          query_embedding: string;
        };
        Returns: {
          category: string;
          id: string;
          name: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
