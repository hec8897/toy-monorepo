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
    @Query('date') date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<LatestRanking> {
    return this.rankingService.getRanking(date, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post('oliveyoung/best')
  @UseGuards(JwtAuthGuard)
  async crawlOliveyoungBest(): Promise<CrawlResultDto> {
    return this.crawlingService.crawlAndSave();
  }
}
