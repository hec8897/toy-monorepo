import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AgentModule } from '@/agent/agent.module';
import { ConceptsModule } from '@/concepts/concepts.module';
import { ConnectionsModule } from '@/connections/connections.module';
import { DashboardModule } from '@/dashboard/dashboard.module';
import { EmbeddingModule } from '@/embedding/embedding.module';
import { JournalModule } from '@/journal/journal.module';
import { MindmapModule } from '@/mindmap/mindmap.module';
import { SupabaseModule } from '@/supabase/supabase.module';
import { TestModule } from '@/test/test.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    EmbeddingModule,
    AgentModule,
    JournalModule,
    ConceptsModule,
    ConnectionsModule,
    MindmapModule,
    DashboardModule,
    TestModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
