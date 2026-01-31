import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CrawlResultDto, LatestRankingDto } from './dto/crawl-result.dto';
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

  async getLatestRanking(): Promise<LatestRankingDto> {
    // 가장 최신 스냅샷 시간 조회
    const latestSnapshots = await this.rankingSnapshotRepository.find({
      order: { snapshotAt: 'DESC' },
      select: ['snapshotAt'],
      take: 1,
    });

    if (latestSnapshots.length === 0) {
      return {
        snapshotAt: null,
        rankings: [],
      };
    }

    const latestSnapshot = latestSnapshots[0];

    // 해당 시간의 모든 랭킹 조회
    const rankings = await this.rankingSnapshotRepository.find({
      where: { snapshotAt: latestSnapshot.snapshotAt },
      relations: ['product'],
      order: { rank: 'ASC' },
    });

    return {
      snapshotAt: latestSnapshot.snapshotAt.toISOString(),
      rankings: rankings.map((r) => ({
        rank: r.rank,
        productCode: r.product.productCode,
        name: r.product.name,
        brandName: r.product.brandName,
        price: Number(r.price),
        originalPrice: r.originalPrice ? Number(r.originalPrice) : null,
        discountRate: r.discountRate,
        imageUrl: r.product.imageUrl,
        productUrl: r.product.productUrl,
      })),
    };
  }

  getAdminPageHtml(): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>크롤링 관리</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 40px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 30px; }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .card h2 { color: #666; font-size: 14px; margin-bottom: 16px; }
    button {
      background: #9bce26;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #8ab820; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    .result {
      margin-top: 20px;
      padding: 16px;
      border-radius: 8px;
      display: none;
    }
    .result.success { background: #e8f5e9; color: #2e7d32; }
    .result.error { background: #ffebee; color: #c62828; }
    .result.loading { background: #e3f2fd; color: #1565c0; display: block; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #9bce26; }
    .stat-label { font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛒 올리브영 크롤링 관리</h1>

    <div class="card">
      <h2>베스트 랭킹 크롤링</h2>
      <button id="crawlBtn" onclick="runCrawling()">
        🚀 크롤링 실행
      </button>
      <div id="result" class="result"></div>
    </div>

    <div class="card">
      <h2>최신 랭킹 조회</h2>
      <button onclick="fetchLatest()">📊 최신 데이터 보기</button>
      <div id="latestResult" class="result"></div>
    </div>
  </div>

  <script>
    async function runCrawling() {
      const btn = document.getElementById('crawlBtn');
      const result = document.getElementById('result');

      btn.disabled = true;
      btn.textContent = '⏳ 크롤링 중...';
      result.className = 'result loading';
      result.textContent = '크롤링을 실행 중입니다. 잠시만 기다려주세요...';

      try {
        const res = await fetch('/api/crawling/oliveyoung/best', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          result.className = 'result success';
          result.innerHTML = \`
            <strong>✅ \${data.message}</strong>
            <div class="stats">
              <div class="stat">
                <div class="stat-value">\${data.data.totalProducts}</div>
                <div class="stat-label">총 상품</div>
              </div>
              <div class="stat">
                <div class="stat-value">\${data.data.newProducts}</div>
                <div class="stat-label">신규 상품</div>
              </div>
              <div class="stat">
                <div class="stat-value">\${data.data.updatedProducts}</div>
                <div class="stat-label">업데이트</div>
              </div>
            </div>
          \`;
        } else {
          result.className = 'result error';
          result.textContent = '❌ ' + (data.error || data.message);
        }
      } catch (err) {
        result.className = 'result error';
        result.textContent = '❌ 요청 실패: ' + err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = '🚀 크롤링 실행';
      }
    }

    async function fetchLatest() {
      const result = document.getElementById('latestResult');
      result.className = 'result loading';
      result.textContent = '데이터를 불러오는 중...';

      try {
        const res = await fetch('/api/crawling/oliveyoung/best');
        const data = await res.json();

        if (data.rankings.length === 0) {
          result.className = 'result';
          result.style.display = 'block';
          result.style.background = '#fff3e0';
          result.style.color = '#e65100';
          result.textContent = '📭 저장된 랭킹 데이터가 없습니다. 크롤링을 먼저 실행해주세요.';
        } else {
          result.className = 'result success';
          result.innerHTML = \`
            <strong>📅 스냅샷: \${new Date(data.snapshotAt).toLocaleString('ko-KR')}</strong>
            <p style="margin-top: 8px;">총 \${data.rankings.length}개 상품</p>
            <div style="margin-top: 12px; max-height: 300px; overflow-y: auto;">
              \${data.rankings.slice(0, 10).map(r => \`
                <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
                  <strong>\${r.rank}위</strong> \${r.brandName} - \${r.name.substring(0, 30)}...
                  <span style="color: #9bce26; font-weight: bold;">\${r.price.toLocaleString()}원</span>
                </div>
              \`).join('')}
              \${data.rankings.length > 10 ? '<p style="color: #999; margin-top: 8px;">... 외 ' + (data.rankings.length - 10) + '개 상품</p>' : ''}
            </div>
          \`;
        }
      } catch (err) {
        result.className = 'result error';
        result.textContent = '❌ 조회 실패: ' + err.message;
      }
    }
  </script>
</body>
</html>
    `;
  }
}
