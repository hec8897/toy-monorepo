import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';

import type { RankingItem } from '@toy-monorepo/types';

@Injectable()
export class OliveyoungCrawler {
  private readonly logger = new Logger(OliveyoungCrawler.name);
  private readonly bestUrl =
    'https://www.oliveyoung.co.kr/store/main/getBestList.do';

  async crawlBestRanking(): Promise<RankingItem[]> {
    this.logger.log('브라우저 시작...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      this.logger.log(`페이지 로딩: ${this.bestUrl}`);
      await page.goto(this.bestUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      await page.waitForSelector('.prd_info', { timeout: 30000 });

      this.logger.log('상품 정보 추출 중...');

      const products = await page.evaluate(() => {
        const items: RankingItem[] = [];
        const productElements = document.querySelectorAll('.prd_info');

        productElements.forEach((element, index) => {
          try {
            const parent = element.closest('li');
            if (!parent) return;

            const rankElement = parent.querySelector('.rank');
            const rank = rankElement
              ? parseInt(rankElement.textContent?.trim() || '') || index + 1
              : index + 1;

            const linkElement = element.querySelector('a');
            const productLink = linkElement?.getAttribute('href') || '';
            const productCodeMatch = productLink.match(/goodsNo=(\w+)/);
            const productCode = productCodeMatch ? productCodeMatch[1] : '';

            const nameElement = element.querySelector('.tx_name');
            const name = nameElement?.textContent?.trim() || '';

            const brandElement = element.querySelector('.tx_brand');
            const brandName = brandElement?.textContent?.trim() || '';

            const priceElement = element.querySelector('.tx_cur .tx_num');
            const priceText = priceElement?.textContent?.trim() || '0';
            const price = parseInt(priceText.replace(/,/g, '')) || 0;

            const originalPriceElement =
              element.querySelector('.tx_org .tx_num');
            const originalPriceText =
              originalPriceElement?.textContent?.trim() || '';
            const originalPrice = originalPriceText
              ? parseInt(originalPriceText.replace(/,/g, ''))
              : null;

            const discountElement = element.querySelector('.tx_per');
            const discountText = discountElement?.textContent?.trim() || '';
            const discountRate = discountText
              ? parseInt(discountText.replace('%', ''))
              : null;

            const imageElement = parent.querySelector('.prd_img img');
            const imageUrl = imageElement?.getAttribute('src') || '';

            const productUrl = productLink.startsWith('http')
              ? productLink
              : `https://www.oliveyoung.co.kr${productLink}`;

            if (name && productCode) {
              items.push({
                rank,
                productCode,
                name,
                brandName,
                price,
                originalPrice,
                discountRate,
                imageUrl,
                productUrl,
              });
            }
          } catch {
            // 파싱 오류 무시
          }
        });

        return items;
      });

      this.logger.log(`크롤링 완료: ${products.length}개 상품`);
      return products;
    } finally {
      await browser.close();
      this.logger.log('브라우저 종료');
    }
  }
}
