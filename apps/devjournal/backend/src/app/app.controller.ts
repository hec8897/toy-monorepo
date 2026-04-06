import { Controller, Get } from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';

@Controller()
export class AppController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get('health')
  async health() {
    const { data, error } = await this.supabase.anon
      .from('concepts')
      .select('count')
      .limit(1);

    return {
      status: error ? 'error' : 'ok',
      supabase: error ? error.message : 'connected',
      timestamp: new Date().toISOString(),
      ...(data && { concepts_table: 'accessible' }),
    };
  }
}
