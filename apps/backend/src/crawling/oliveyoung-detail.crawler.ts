import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';

export interface CrawledProductDetail {
  rating: number | null;
  reviewCount: number | null;
  volume: string | null;
  manufacturer: string | null;
  debug?: Record<string, unknown>;
}

@Injectable()
export class OliveyoungDetailCrawler {
  private readonly logger = new Logger(OliveyoungDetailCrawler.name);

  async crawlProductDetail(productUrl: string): Promise<CrawledProductDetail> {
    this.logger.log('상세 페이지 크롤링 시작...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      this.logger.log(`페이지 로딩: ${productUrl}`);
      await page.goto(productUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      // 페이지 로드 대기
      await page
        .waitForSelector('.prd_detail_box', { timeout: 30000 })
        .catch(() => {
          this.logger.warn('상품 상세 박스를 찾을 수 없습니다.');
        });

      this.logger.log('상세 정보 추출 중...');

      // 디버깅: 페이지에서 사용 가능한 셀렉터 확인
      const debugInfo = await page.evaluate(() => {
        // 페이지 타이틀과 URL 확인
        const pageTitle = document.title;
        const bodyText =
          document.body?.innerText?.substring(0, 500) || 'no body';

        // 다양한 셀렉터 시도 (Review, rating 관련)
        const allClasses = Array.from(document.querySelectorAll('*'))
          .map((el) => el.className)
          .filter(
            (c) =>
              typeof c === 'string' &&
              (c.includes('Review') ||
                c.includes('rating') ||
                c.includes('star')),
          )
          .slice(0, 30);

        // 상품명 찾기 시도
        const h2 =
          document.querySelector('h2')?.textContent?.substring(0, 50) || null;
        const h3 =
          document.querySelector('h3')?.textContent?.substring(0, 50) || null;

        // rating 요소 확인
        const ratingEl = document.querySelector('.rating');
        const ratingHtml = ratingEl?.outerHTML?.substring(0, 200) || null;
        const ratingText = ratingEl?.textContent || null;

        return {
          pageTitle,
          bodyPreview: bodyText,
          prdClasses: allClasses,
          h2,
          h3,
          ratingHtml,
          ratingText,
        };
      });
      this.logger.log(
        `디버그 셀렉터 확인: ${JSON.stringify(debugInfo, null, 2)}`,
      );

      const detail = await page.evaluate(() => {
        // 평점 추출: .rating (텍스트에서 숫자만 추출)
        let rating: number | null = null;
        const ratingElement = document.querySelector('.rating');
        if (ratingElement) {
          const ratingText = ratingElement.textContent?.trim() || '';
          // "평점4.8" 형태에서 숫자만 추출
          const match = ratingText.match(/[\d.]+/);
          if (match) {
            const parsed = parseFloat(match[0]);
            if (!isNaN(parsed)) {
              rating = parsed;
            }
          }
        }

        // 리뷰 수 추출: span.GoodsDetailTabs_count__nz2tF.GoodsDetailTabs_review-count__Vi4U_
        let reviewCount: number | null = null;
        const reviewElement = document.querySelector(
          'span.GoodsDetailTabs_count__nz2tF.GoodsDetailTabs_review-count__Vi4U_',
        );
        if (reviewElement) {
          const reviewText = reviewElement.textContent?.trim() || '';
          // 숫자만 추출 (예: "1,234" → 1234)
          const match = reviewText.match(/[\d,]+/);
          if (match) {
            reviewCount = parseInt(match[0].replace(/,/g, ''), 10);
          }
        }

        return {
          rating,
          reviewCount,
          volume: null, // 추후 추가
          manufacturer: null, // 추후 추가
        };
      });

      this.logger.log(
        `크롤링 완료: 평점=${detail.rating}, 리뷰=${detail.reviewCount}`,
      );

      // 디버그 모드일 때 정보 포함
      if (process.env.NODE_ENV === 'development') {
        return { ...detail, debug: debugInfo };
      }
      return detail;
    } finally {
      await browser.close();
      this.logger.log('브라우저 종료');
    }
  }
}
