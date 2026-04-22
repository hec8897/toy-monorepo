import { Module } from '@nestjs/common';

import { AgentModule } from '@/agent/agent.module';
import { SupabaseAuthGuard } from '@/auth/supabase-auth.guard';
import { ConceptsModule } from '@/concepts/concepts.module';
import { ConnectionsModule } from '@/connections/connections.module';

import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';

@Module({
  imports: [AgentModule, ConceptsModule, ConnectionsModule],
  controllers: [JournalController],
  providers: [JournalService, SupabaseAuthGuard],
})
export class JournalModule {}
