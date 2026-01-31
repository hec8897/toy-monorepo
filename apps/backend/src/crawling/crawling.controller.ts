import { Controller, Get, Header, Post, UseGuards } from '@nestjs/common';

import { CrawlingService } from './crawling.service';
import { CrawlResultDto, LatestRankingDto } from './dto/crawl-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('crawling')
export class CrawlingController {
  constructor(private readonly crawlingService: CrawlingService) {}

  @Get()
  @Header('Content-Type', 'text/html')
  getAdminPage(): string {
    return this.crawlingService.getAdminPageHtml();
  }

  @Get('oliveyoung/best')
  @UseGuards(JwtAuthGuard)
  async getLatestRanking(): Promise<LatestRankingDto> {
    return this.crawlingService.getLatestRanking();
  }

  @Post('oliveyoung/best')
  @UseGuards(JwtAuthGuard)
  async crawlOliveyoungBest(): Promise<CrawlResultDto> {
    return this.crawlingService.crawlAndSave();
  }
}
