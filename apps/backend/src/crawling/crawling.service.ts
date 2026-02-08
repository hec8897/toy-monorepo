import { readFileSync } from 'fs';
import { join } from 'path';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CrawlResultDto } from './dto/crawl-result.dto';
import { OliveyoungCrawler } from './oliveyoung.crawler';
import { Product } from '../entities/product.entity';
import { RankingSnapshot } from '../entities/ranking-snapshot.entity';

@Injectable()
export class CrawlingService {
  private readonly logger = new Logger(CrawlingService.name);

  constructor(
    private readonly oliveyoungCrawler: OliveyoungCrawler,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(RankingSnapshot)
    private readonly rankingSnapshotRepository: Repository<RankingSnapshot>,
  ) {}

  async crawlAndSave(): Promise<CrawlResultDto> {
    const snapshotAt = new Date();

    try {
      this.logger.log('올리브영 베스트 크롤링 시작');
      const crawledProducts = await this.oliveyoungCrawler.crawlBestRanking();

      if (crawledProducts.length === 0) {
        return {
          success: false,
          message: '크롤링 실패',
          error: '크롤링된 상품이 없습니다. HTML 구조를 확인해주세요.',
        };
      }

      let newProducts = 0;
      let updatedProducts = 0;

      for (const crawled of crawledProducts) {
        // 상품 조회 또는 생성
        let product = await this.productRepository.findOne({
          where: { productCode: crawled.productCode },
        });

        if (!product) {
          product = this.productRepository.create({
            productCode: crawled.productCode,
            name: crawled.name,
            brandName: crawled.brandName,
            imageUrl: crawled.imageUrl,
            productUrl: crawled.productUrl,
          });
          await this.productRepository.save(product);
          newProducts++;
        } else {
          // 기존 상품 정보 업데이트
          product.name = crawled.name;
          product.brandName = crawled.brandName;
          product.imageUrl = crawled.imageUrl;
          product.productUrl = crawled.productUrl;
          await this.productRepository.save(product);
          updatedProducts++;
        }

        // 랭킹 스냅샷 저장
        const snapshot = this.rankingSnapshotRepository.create({
          productId: product.id,
          rank: crawled.rank,
          price: crawled.price,
          originalPrice: crawled.originalPrice,
          discountRate: crawled.discountRate,
          snapshotAt,
        });
        await this.rankingSnapshotRepository.save(snapshot);
      }

      this.logger.log(
        `크롤링 완료: 총 ${crawledProducts.length}개, 신규 ${newProducts}개, 업데이트 ${updatedProducts}개`,
      );

      return {
        success: true,
        message: '크롤링 완료',
        data: {
          totalProducts: crawledProducts.length,
          newProducts,
          updatedProducts,
          snapshotAt: snapshotAt.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('크롤링 실패', error);
      return {
        success: false,
        message: '크롤링 실패',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  getAdminPageHtml(): string {
    const templatePath = join(__dirname, 'crawling', 'templates', 'admin.html');
    return readFileSync(templatePath, 'utf-8');
  }
}
