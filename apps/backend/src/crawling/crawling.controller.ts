import {
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { CrawlingService } from './crawling.service';
import { CrawlResultDto } from './dto/crawl-result.dto';
import { GetBrandsQueryDto } from './dto/get-brands-query.dto';
import { GetRankingQueryDto } from './dto/get-ranking-query.dto';
import { ProductDetailQueryDto } from './dto/product-detail-query.dto';
import { ProductDetailService } from './product-detail.service';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import type {
  AsyncCrawlResponse,
  BrandList,
  LatestRanking,
  ProductDetailResponse,
  SnapshotList,
} from '@toy-monorepo/types';

@Controller('crawling')
export class CrawlingController {
  constructor(
    private readonly crawlingService: CrawlingService,
    private readonly rankingService: RankingService,
    private readonly productDetailService: ProductDetailService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/html')
  getAdminPage(): string {
    return this.crawlingService.getAdminPageHtml();
  }

  @Get('oliveyoung/snapshots')
  @UseGuards(JwtAuthGuard)
  async getSnapshots(): Promise<SnapshotList> {
    return this.rankingService.getSnapshots();
  }

  @Get('oliveyoung/brands')
  @UseGuards(JwtAuthGuard)
  async getBrands(
    @Query(ZodValidationPipe) query: GetBrandsQueryDto,
  ): Promise<BrandList> {
    return this.rankingService.getBrandsWithMinProducts(query.date);
  }

  @Get('oliveyoung/best')
  @UseGuards(JwtAuthGuard)
  async getLatestRanking(
    @Query(ZodValidationPipe) query: GetRankingQueryDto,
  ): Promise<LatestRanking> {
    const { date, page = 1, limit = 20, sortField, sortOrder, brand } = query;
    const sort =
      sortField && sortOrder
        ? { field: sortField, order: sortOrder }
        : undefined;

    return this.rankingService.getRanking(date, { page, limit }, sort, brand);
  }

  @Post('oliveyoung/best')
  @UseGuards(JwtAuthGuard)
  async crawlOliveyoungBest(): Promise<CrawlResultDto> {
    return this.crawlingService.crawlAndSave();
  }

  /**
   * 제품 상세 정보 조회 (저장된 데이터)
   */
  @Get('oliveyoung/products/:productCode/detail')
  @UseGuards(JwtAuthGuard)
  async getProductDetail(
    @Param('productCode') productCode: string,
  ): Promise<ProductDetailResponse> {
    return this.productDetailService.getDetail(productCode);
  }

  /**
   * 제품 상세 정보 크롤링
   * - async=false (기본): 동기 실행, 크롤링 완료 후 결과 반환
   * - async=true: 비동기 실행, 즉시 응답 후 백그라운드 크롤링
   */
  @Post('oliveyoung/products/:productCode/detail')
  @UseGuards(JwtAuthGuard)
  async crawlProductDetail(
    @Param('productCode') productCode: string,
    @Query(ZodValidationPipe) query: ProductDetailQueryDto,
  ): Promise<ProductDetailResponse | AsyncCrawlResponse> {
    if (query.async) {
      return this.productDetailService.fetchAndSaveAsync(productCode);
    }
    return this.productDetailService.fetchAndSave(productCode);
  }
}
