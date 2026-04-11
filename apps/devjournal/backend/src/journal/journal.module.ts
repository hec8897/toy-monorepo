import { Module } from '@nestjs/common';

import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';

import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';

@Module({
  controllers: [JournalController],
  providers: [JournalService, SupabaseAuthGuard],
})
export class JournalModule {}
