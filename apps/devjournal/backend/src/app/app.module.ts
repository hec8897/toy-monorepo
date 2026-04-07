import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SupabaseModule } from '@/supabase/supabase.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/devjournal/backend/.env',
    }),
    SupabaseModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
