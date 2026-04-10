import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConceptsModule } from '@/concepts/concepts.module';
import { JournalModule } from '@/journal/journal.module';
import { SupabaseModule } from '@/supabase/supabase.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/devjournal/backend/.env',
    }),
    SupabaseModule,
    JournalModule,
    ConceptsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
