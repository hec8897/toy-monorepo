import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

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
  ],
  controllers: [AppController],
})
export class AppModule {}
