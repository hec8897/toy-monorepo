import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  readonly anon: SupabaseClient;
  readonly admin: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const url = this.config.getOrThrow<string>('SUPABASE_URL');
    const anonKey = this.config.getOrThrow<string>('SUPABASE_ANON_KEY');
    const serviceRoleKey = this.config.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    // RLS 적용 — 사용자 요청 시 사용
    this.anon = createClient(url, anonKey);

    // RLS 우회 — AI 분석 결과 쓰기 시 사용
    this.admin = createClient(url, serviceRoleKey);
  }
}
