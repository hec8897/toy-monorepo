import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrawlingController } from './crawling.controller';
import { CrawlingService } from './crawling.service';
import { OliveyoungCrawler } from './oliveyoung.crawler';
import { Product } from '../entities/product.entity';
import { RankingSnapshot } from '../entities/ranking-snapshot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, RankingSnapshot])],
  controllers: [CrawlingController],
  providers: [CrawlingService, OliveyoungCrawler],
})
export class CrawlingModule {}
