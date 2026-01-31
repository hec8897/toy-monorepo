/**
 * 올리브영 베스트 랭킹 크롤링 테스트 스크립트 (Puppeteer 버전)
 * 실행: npx tsx apps/backend/scripts/crawl-oliveyoung.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import puppeteer from 'puppeteer';

interface CrawledProduct {
  rank: number;
  productCode: string;
  name: string;
  brandName: string;
  price: number;
  originalPrice: number | null;
  discountRate: number | null;
  imageUrl: string;
  productUrl: string;
}

async function crawlOliveyoungBest(): Promise<CrawledProduct[]> {
  const url = 'https://www.oliveyoung.co.kr/store/main/getBestList.do';

  console.info('브라우저 시작...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // User-Agent 설정
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    console.info('페이지 로딩:', url);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // 페이지 로딩 대기
    await page.waitForSelector('.prd_info', { timeout: 30000 });

    console.info('상품 정보 추출 중...');

    // 상품 정보 추출
    const products = await page.evaluate(() => {
      const items: CrawledProduct[] = [];
      const productElements = document.querySelectorAll('.prd_info');

      productElements.forEach((element, index) => {
        try {
          const parent = element.closest('li');
          if (!parent) return;

          // 순위
          const rankElement = parent.querySelector('.rank');
          const rank = rankElement
            ? parseInt(rankElement.textContent?.trim() || '') || index + 1
            : index + 1;

          // 상품 링크에서 상품 코드 추출
          const linkElement = element.querySelector('a');
          const productLink = linkElement?.getAttribute('href') || '';
          const productCodeMatch = productLink.match(/goodsNo=(\w+)/);
          const productCode = productCodeMatch ? productCodeMatch[1] : '';

          // 상품명
          const nameElement = element.querySelector('.tx_name');
          const name = nameElement?.textContent?.trim() || '';

          // 브랜드명
          const brandElement = element.querySelector('.tx_brand');
          const brandName = brandElement?.textContent?.trim() || '';

          // 가격 정보
          const priceElement = element.querySelector('.tx_cur .tx_num');
          const priceText = priceElement?.textContent?.trim() || '0';
          const price = parseInt(priceText.replace(/,/g, '')) || 0;

          const originalPriceElement = element.querySelector('.tx_org .tx_num');
          const originalPriceText =
            originalPriceElement?.textContent?.trim() || '';
          const originalPrice = originalPriceText
            ? parseInt(originalPriceText.replace(/,/g, ''))
            : null;

          // 할인율
          const discountElement = element.querySelector('.tx_per');
          const discountText = discountElement?.textContent?.trim() || '';
          const discountRate = discountText
            ? parseInt(discountText.replace('%', ''))
            : null;

          // 이미지 URL
          const imageElement = parent.querySelector('.prd_img img');
          const imageUrl = imageElement?.getAttribute('src') || '';

          // 상품 URL
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
        } catch (error) {
          console.error('상품 파싱 오류:', error);
        }
      });

      return items;
    });

    console.info(`크롤링 완료: ${products.length}개 상품`);
    return products;
  } finally {
    await browser.close();
    console.info('브라우저 종료');
  }
}

function generateMarkdown(products: CrawledProduct[]): string {
  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  let md = `# 올리브영 베스트 랭킹\n\n`;
  md += `> 크롤링 시간: ${now}\n\n`;
  md += `## 요약\n\n`;
  md += `- 총 상품 수: ${products.length}개\n`;
  md += `- 크롤링 날짜: ${dateStr}\n\n`;
  md += `---\n\n`;
  md += `## 랭킹 목록\n\n`;
  md += `| 순위 | 브랜드 | 상품명 | 가격 | 할인율 |\n`;
  md += `|------|--------|--------|------|--------|\n`;

  products.forEach((p) => {
    const priceStr = p.price.toLocaleString() + '원';
    const discountStr = p.discountRate ? `${p.discountRate}%` : '-';
    // 상품명이 너무 길면 자르기
    const shortName = p.name.length > 30 ? p.name.slice(0, 30) + '...' : p.name;

    md += `| ${p.rank} | ${p.brandName} | ${shortName} | ${priceStr} | ${discountStr} |\n`;
  });

  md += `\n---\n\n`;
  md += `## 상세 정보\n\n`;

  products.slice(0, 20).forEach((p) => {
    md += `### ${p.rank}위. ${p.name}\n\n`;
    md += `- **브랜드**: ${p.brandName}\n`;
    md += `- **가격**: ${p.price.toLocaleString()}원`;
    if (p.originalPrice) {
      md += ` (정가: ${p.originalPrice.toLocaleString()}원)`;
    }
    md += `\n`;
    if (p.discountRate) {
      md += `- **할인율**: ${p.discountRate}%\n`;
    }
    md += `- **상품코드**: ${p.productCode}\n`;
    md += `- **링크**: [상품 페이지](${p.productUrl})\n`;
    md += `\n`;
  });

  if (products.length > 20) {
    md += `\n> 상세 정보는 상위 20개 상품만 표시됩니다.\n`;
  }

  return md;
}

async function main() {
  try {
    const products = await crawlOliveyoungBest();

    if (products.length === 0) {
      console.info('크롤링된 상품이 없습니다. HTML 구조를 확인해주세요.');
      return;
    }

    const markdown = generateMarkdown(products);

    // 결과 파일 저장
    const outputDir = path.join(__dirname, '../../../docs');
    const outputPath = path.join(outputDir, 'oliveyoung-best-ranking.md');

    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.info(`\n결과 저장 완료: ${outputPath}`);

    // 간단한 요약 출력
    console.info('\n=== 크롤링 결과 요약 ===');
    console.info(`총 상품 수: ${products.length}개`);
    console.info('\nTop 5 상품:');
    products.slice(0, 5).forEach((p) => {
      console.info(
        `  ${p.rank}위: ${p.brandName} - ${p.name.slice(0, 30)}... (${p.price.toLocaleString()}원)`,
      );
    });
  } catch (error) {
    console.error('크롤링 실패:', error);
  }
}

main();
