import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RankingSnapshot } from '../entities/ranking-snapshot.entity';

import type { RankingSortField, SortOrder } from './dto/get-ranking-query.dto';
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
   * 랭킹 조회 (날짜 파라미터 지원 + 순위 변동 계산 + 페이지네이션 + 정렬)
   * @param date - 조회할 날짜 (YYYY-MM-DD), 미입력시 최신
   * @param pagination - 페이지네이션 옵션
   * @param sort - 정렬 옵션
   */
  async getRanking(
    date?: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 },
    sort?: { field: RankingSortField; order: SortOrder },
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

    // 3. 이전 스냅샷의 랭킹 조회 (정렬 계산을 위해 먼저 조회)
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

    // 4. 전체 개수 조회
    const total = await this.rankingSnapshotRepository.count({
      where: { snapshotAt: targetSnapshotAt },
    });

    // 5. 대상 스냅샷의 랭킹 조회 (정렬 및 페이지네이션 적용)
    const rankings = await this.getRankingsWithSort(
      targetSnapshotAt,
      previousSnapshotAt,
      previousRankMap,
      pagination,
      sort,
    );

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
   * 정렬 옵션을 적용한 랭킹 조회
   */
  private async getRankingsWithSort(
    targetSnapshotAt: Date,
    previousSnapshotAt: Date | null,
    previousRankMap: Map<string, number>,
    pagination: { page: number; limit: number },
    sort?: { field: RankingSortField; order: SortOrder },
  ): Promise<RankingSnapshot[]> {
    const { page, limit } = pagination;

    // 정렬 옵션이 없으면 기본 정렬 (rank ASC)
    if (!sort) {
      return this.rankingSnapshotRepository.find({
        where: { snapshotAt: targetSnapshotAt },
        relations: ['product'],
        order: { rank: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    // rankChange 정렬은 특수 처리 필요 (계산 필드)
    if (sort.field === 'rankChange') {
      return this.getRankingsSortedByRankChange(
        targetSnapshotAt,
        previousSnapshotAt,
        previousRankMap,
        pagination,
        sort.order,
      );
    }

    // price, name 정렬은 QueryBuilder 사용
    const queryBuilder = this.rankingSnapshotRepository
      .createQueryBuilder('snapshot')
      .leftJoinAndSelect('snapshot.product', 'product')
      .where('snapshot.snapshot_at = :snapshotAt', {
        snapshotAt: targetSnapshotAt,
      });

    // 정렬 필드 매핑
    const sortFieldMap: Record<string, string> = {
      price: 'snapshot.price',
      name: 'product.name',
    };

    const sortColumn = sortFieldMap[sort.field];
    if (sortColumn) {
      queryBuilder.orderBy(sortColumn, sort.order);
    }

    return queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
  }

  /**
   * rankChange 기준 정렬 (계산 필드이므로 특수 처리)
   */
  private async getRankingsSortedByRankChange(
    targetSnapshotAt: Date,
    previousSnapshotAt: Date | null,
    previousRankMap: Map<string, number>,
    pagination: { page: number; limit: number },
    order: SortOrder,
  ): Promise<RankingSnapshot[]> {
    const { page, limit } = pagination;

    // 이전 스냅샷이 없으면 기본 정렬
    if (!previousSnapshotAt) {
      return this.rankingSnapshotRepository.find({
        where: { snapshotAt: targetSnapshotAt },
        relations: ['product'],
        order: { rank: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    // 모든 현재 랭킹을 조회
    const allRankings = await this.rankingSnapshotRepository.find({
      where: { snapshotAt: targetSnapshotAt },
      relations: ['product'],
    });

    // rankChange 계산 및 정렬
    const rankingsWithChange = allRankings.map((r) => {
      const previousRank = previousRankMap.get(r.product.productCode);
      const rankChange =
        previousRank !== undefined ? previousRank - r.rank : null;
      return { ranking: r, rankChange };
    });

    // 정렬 (null은 항상 마지막)
    rankingsWithChange.sort((a, b) => {
      // null 값 처리 (NULLS LAST)
      if (a.rankChange === null && b.rankChange === null) return 0;
      if (a.rankChange === null) return 1;
      if (b.rankChange === null) return -1;

      // 정렬 순서 적용
      return order === 'ASC'
        ? a.rankChange - b.rankChange
        : b.rankChange - a.rankChange;
    });

    // 페이지네이션 적용
    const start = (page - 1) * limit;
    return rankingsWithChange.slice(start, start + limit).map((r) => r.ranking);
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
