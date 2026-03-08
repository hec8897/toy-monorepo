import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OliveyoungDetailCrawler } from './oliveyoung-detail.crawler';
import { ProductDetail } from '../entities/product-detail.entity';
import { Product } from '../entities/product.entity';

import type {
  ProductDetailResponse,
  AsyncCrawlResponse,
} from '@toy-monorepo/types';

@Injectable()
export class ProductDetailService {
  private readonly logger = new Logger(ProductDetailService.name);

  constructor(
    private readonly detailCrawler: OliveyoungDetailCrawler,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductDetail)
    private readonly productDetailRepository: Repository<ProductDetail>,
  ) {}

  /**
   * 저장된 상세 정보 조회
   */
  async getDetail(productCode: string): Promise<ProductDetailResponse> {
    const product = await this.productRepository.findOne({
      where: { productCode },
    });

    if (!product) {
      throw new NotFoundException(`상품을 찾을 수 없습니다: ${productCode}`);
    }

    const detail = await this.productDetailRepository.findOne({
      where: { productId: product.id },
    });

    if (!detail) {
      return {
        success: true,
        data: null,
        message: '상세 정보가 아직 크롤링되지 않았습니다.',
      };
    }

    return {
      success: true,
      data: {
        productCode,
        rating: detail.rating ? Number(detail.rating) : null,
        reviewCount: detail.reviewCount,
        volume: detail.volume,
        manufacturer: detail.manufacturer,
        fetchedAt: detail.fetchedAt.toISOString(),
      },
    };
  }

  /**
   * 상세 정보 크롤링 및 저장 (동기)
   */
  async fetchAndSave(productCode: string): Promise<ProductDetailResponse> {
    const product = await this.productRepository.findOne({
      where: { productCode },
    });

    if (!product) {
      throw new NotFoundException(`상품을 찾을 수 없습니다: ${productCode}`);
    }

    if (!product.productUrl) {
      return {
        success: false,
        data: null,
        message: '상품 URL이 없습니다.',
      };
    }

    try {
      this.logger.log(`상세 크롤링 시작: ${productCode}`);
      const crawledData = await this.detailCrawler.crawlProductDetail(
        product.productUrl,
      );

      // 기존 상세 정보 조회
      let detail = await this.productDetailRepository.findOne({
        where: { productId: product.id },
      });

      const now = new Date();

      if (detail) {
        // 업데이트
        detail.rating = crawledData.rating;
        detail.reviewCount = crawledData.reviewCount;
        detail.volume = crawledData.volume;
        detail.manufacturer = crawledData.manufacturer;
        detail.fetchedAt = now;
      } else {
        // 새로 생성
        detail = this.productDetailRepository.create({
          productId: product.id,
          rating: crawledData.rating,
          reviewCount: crawledData.reviewCount,
          volume: crawledData.volume,
          manufacturer: crawledData.manufacturer,
          fetchedAt: now,
        });
      }

      await this.productDetailRepository.save(detail);
      this.logger.log(`상세 크롤링 완료: ${productCode}`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = {
        success: true,
        data: {
          productCode,
          rating: crawledData.rating,
          reviewCount: crawledData.reviewCount,
          volume: crawledData.volume,
          manufacturer: crawledData.manufacturer,
          fetchedAt: now.toISOString(),
        },
      };

      // 개발 모드에서 디버그 정보 포함
      if (crawledData.debug) {
        response.debug = crawledData.debug;
      }

      return response;
    } catch (error) {
      this.logger.error(`상세 크롤링 실패: ${productCode}`, error);
      return {
        success: false,
        data: null,
        message:
          error instanceof Error
            ? error.message
            : '크롤링 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 상세 정보 크롤링 (비동기 - 백그라운드 실행)
   */
  async fetchAndSaveAsync(productCode: string): Promise<AsyncCrawlResponse> {
    const product = await this.productRepository.findOne({
      where: { productCode },
    });

    if (!product) {
      throw new NotFoundException(`상품을 찾을 수 없습니다: ${productCode}`);
    }

    // 백그라운드에서 실행 (fire-and-forget)
    this.fetchAndSave(productCode).catch((err) =>
      this.logger.error(`비동기 크롤링 실패: ${productCode}`, err),
    );

    return {
      success: true,
      status: 'processing',
      message: '크롤링이 시작되었습니다. GET 요청으로 결과를 확인하세요.',
    };
  }
}
