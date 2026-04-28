import { Module } from '@nestjs/common';

import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { SupabaseModule } from '@/supabase/supabase.module';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [SupabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService, SupabaseAuthGuard],
  exports: [DashboardService],
})
export class DashboardModule {}
