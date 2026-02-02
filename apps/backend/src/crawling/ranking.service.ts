import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RankingSnapshot } from '../entities/ranking-snapshot.entity';

import type { LatestRanking, SnapshotList } from '@toy-monorepo/types';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(RankingSnapshot)
    private readonly rankingSnapshotRepository: Repository<RankingSnapshot>,
  ) {}

  /**
   * 사용 가능한 스냅샷 목록 조회
   */
  async getSnapshots(): Promise<SnapshotList> {
    const snapshots = await this.rankingSnapshotRepository
      .createQueryBuilder('snapshot')
      .select('DISTINCT snapshot.snapshot_at', 'snapshotAt')
      .orderBy('snapshot.snapshot_at', 'DESC')
      .getRawMany<{ snapshotAt: Date }>();

    return {
      snapshots: snapshots.map((s) => ({
        date: s.snapshotAt.toISOString().split('T')[0],
        snapshotAt: s.snapshotAt.toISOString(),
      })),
    };
  }

  /**
   * 랭킹 조회 (날짜 파라미터 지원 + 순위 변동 계산 + 페이지네이션)
   * @param date - 조회할 날짜 (YYYY-MM-DD), 미입력시 최신
   * @param pagination - 페이지네이션 옵션
   */
  async getRanking(
    date?: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
  ): Promise<LatestRanking> {
    const { page, limit } = pagination;

    // 1. 대상 스냅샷 시간 결정
    const targetSnapshotAt = await this.getSnapshotAtByDate(date);

    if (!targetSnapshotAt) {
      return {
        snapshotAt: null,
        rankings: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    // 2. 이전 스냅샷 시간 조회 (순위 변동 계산용)
    const previousSnapshotAt =
      await this.getPreviousSnapshotAt(targetSnapshotAt);

    // 3. 전체 개수 조회
    const total = await this.rankingSnapshotRepository.count({
      where: { snapshotAt: targetSnapshotAt },
    });

    // 4. 대상 스냅샷의 랭킹 조회 (페이지네이션 적용)
    const rankings = await this.rankingSnapshotRepository.find({
      where: { snapshotAt: targetSnapshotAt },
      relations: ['product'],
      order: { rank: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 5. 이전 스냅샷의 랭킹 조회 (있는 경우)
    const previousRankMap = new Map<string, number>();
    if (previousSnapshotAt) {
      const previousRankings = await this.rankingSnapshotRepository.find({
        where: { snapshotAt: previousSnapshotAt },
        relations: ['product'],
      });
      previousRankings.forEach((r) => {
        previousRankMap.set(r.product.productCode, r.rank);
      });
    }

    // 6. 순위 변동 계산 및 응답 생성
    return {
      snapshotAt: targetSnapshotAt.toISOString(),
      rankings: rankings.map((r) => {
        const previousRank = previousRankMap.get(r.product.productCode);
        const isNew = previousSnapshotAt !== null && previousRank === undefined;
        const rankChange =
          previousRank !== undefined ? previousRank - r.rank : null;

        return {
          rank: r.rank,
          productCode: r.product.productCode,
          name: r.product.name,
          brandName: r.product.brandName,
          price: Number(r.price),
          originalPrice: r.originalPrice ? Number(r.originalPrice) : null,
          discountRate: r.discountRate,
          imageUrl: r.product.imageUrl,
          productUrl: r.product.productUrl,
          rankChange,
          isNew,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 날짜로 스냅샷 시간 조회
   */
  private async getSnapshotAtByDate(date?: string): Promise<Date | null> {
    const queryBuilder = this.rankingSnapshotRepository
      .createQueryBuilder('snapshot')
      .select('snapshot.snapshot_at', 'snapshotAt');

    if (date) {
      // 특정 날짜의 스냅샷 조회
      queryBuilder
        .where('DATE(snapshot.snapshot_at) = :date', { date })
        .orderBy('snapshot.snapshot_at', 'DESC');
    } else {
      // 최신 스냅샷 조회
      queryBuilder.orderBy('snapshot.snapshot_at', 'DESC');
    }

    const result = await queryBuilder
      .limit(1)
      .getRawOne<{ snapshotAt: Date }>();
    return result?.snapshotAt ?? null;
  }

  /**
   * 이전 스냅샷 시간 조회
   */
  private async getPreviousSnapshotAt(
    currentSnapshotAt: Date,
  ): Promise<Date | null> {
    const result = await this.rankingSnapshotRepository
      .createQueryBuilder('snapshot')
      .select('DISTINCT snapshot.snapshot_at', 'snapshotAt')
      .where('snapshot.snapshot_at < :current', { current: currentSnapshotAt })
      .orderBy('snapshot.snapshot_at', 'DESC')
      .limit(1)
      .getRawOne<{ snapshotAt: Date }>();

    return result?.snapshotAt ?? null;
  }
}
