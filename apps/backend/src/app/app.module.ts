import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { getDatabaseConfig } from '../config/database.config';
import { CrawlingModule } from '../crawling/crawling.module';
import { MembersModule } from '../members/members.module';
import { TablesModule } from '../tables/tables.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    TablesModule,
    MembersModule,
    AuthModule,
    CrawlingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
