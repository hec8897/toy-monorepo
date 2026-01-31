import { Controller, Get, Header, Post } from '@nestjs/common';

import { CrawlingService } from './crawling.service';
import { CrawlResultDto, LatestRankingDto } from './dto/crawl-result.dto';

@Controller('crawling')
export class CrawlingController {
  constructor(private readonly crawlingService: CrawlingService) {}

  @Get()
  @Header('Content-Type', 'text/html')
  getAdminPage(): string {
    return this.crawlingService.getAdminPageHtml();
  }

  @Get('oliveyoung/best')
  async getLatestRanking(): Promise<LatestRankingDto> {
    return this.crawlingService.getLatestRanking();
  }

  @Post('oliveyoung/best')
  async crawlOliveyoungBest(): Promise<CrawlResultDto> {
    return this.crawlingService.crawlAndSave();
  }
}
