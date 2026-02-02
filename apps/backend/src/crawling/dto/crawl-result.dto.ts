/**
 * 크롤링 결과 DTO (백엔드 전용)
 */
export class CrawlResultDto {
  success: boolean;
  message: string;
  data?: {
    totalProducts: number;
    newProducts: number;
    updatedProducts: number;
    snapshotAt: string;
  };
  error?: string;
}
