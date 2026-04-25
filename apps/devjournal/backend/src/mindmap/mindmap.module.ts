import { Module } from '@nestjs/common';

import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';

import { MindmapController } from './mindmap.controller';
import { MindmapService } from './mindmap.service';

@Module({
  controllers: [MindmapController],
  providers: [MindmapService, SupabaseAuthGuard],
  exports: [MindmapService],
})
export class MindmapModule {}
