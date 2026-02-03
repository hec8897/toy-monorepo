import {
  Controller,
  Get,
  Header,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CrawlingService } from './crawling.service';
import { CrawlResultDto } from './dto/crawl-result.dto';
import { GetRankingQueryDto } from './dto/get-ranking-query.dto';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import type { LatestRanking, SnapshotList } from '@toy-monorepo/types';

@Controller('crawling')
export class CrawlingController {
  constructor(
    private readonly crawlingService: CrawlingService,
    private readonly rankingService: RankingService,
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

  @Get('oliveyoung/best')
  @UseGuards(JwtAuthGuard)
  async getLatestRanking(
    @Query() query: GetRankingQueryDto,
  ): Promise<LatestRanking> {
    const { date, page = 1, limit = 20 } = query;
    return this.rankingService.getRanking(date, { page, limit });
  }

  @Post('oliveyoung/best')
  @UseGuards(JwtAuthGuard)
  async crawlOliveyoungBest(): Promise<CrawlResultDto> {
    return this.crawlingService.crawlAndSave();
  }
}
