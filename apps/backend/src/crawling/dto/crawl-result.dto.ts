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

export class RankingItemDto {
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

export class LatestRankingDto {
  snapshotAt: string | null;
  rankings: RankingItemDto[];
}
