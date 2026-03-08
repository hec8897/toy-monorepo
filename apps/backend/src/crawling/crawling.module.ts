import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrawlingController } from './crawling.controller';
import { CrawlingService } from './crawling.service';
import { OliveyoungDetailCrawler } from './oliveyoung-detail.crawler';
import { OliveyoungCrawler } from './oliveyoung.crawler';
import { ProductDetailService } from './product-detail.service';
import { RankingService } from './ranking.service';
import { ProductDetail } from '../entities/product-detail.entity';
import { Product } from '../entities/product.entity';
import { RankingSnapshot } from '../entities/ranking-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductDetail, RankingSnapshot]),
  ],
  controllers: [CrawlingController],
  providers: [
    CrawlingService,
    RankingService,
    ProductDetailService,
    OliveyoungCrawler,
    OliveyoungDetailCrawler,
  ],
})
export class CrawlingModule {}
