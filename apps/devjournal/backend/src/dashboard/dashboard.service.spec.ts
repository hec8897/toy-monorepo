import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { SupabaseService } from '@/supabase/supabase.service';

import { DashboardService } from './dashboard.service';

const TEST_USER_ID = 'user-1234';

interface CountResult {
  count: number | null;
  error: { message: string; details?: string } | null;
}

interface RpcResult<T> {
  data: T | null;
  error: { message: string; details?: string } | null;
}

/**
 * SupabaseClient 의 from()/rpc() 체인을 모킹하기 위한 헬퍼.
 *
 * - from('entries').select(..., { count: 'exact', head: true })
 *     .eq('user_id', userId).is('deleted_at', null)
 *   → 마지막 체인이 `await`되면 { count, error } 반환
 *
 * - from('user_concepts')...eq('user_id', userId).eq('mastery_level', 'mastered')
 *   → 동일하게 { count, error } 반환
 *
 * 어떤 테이블 / 어떤 호출 순서를 의도했는지 확인할 수 있도록
 * 호출 인자를 그대로 기록한다.
 */
interface CountQueryBuilder {
  select: jest.Mock;
  eq: jest.Mock;
  is: jest.Mock;
  then: (onFulfilled: (value: CountResult) => unknown) => Promise<unknown>;
}

function createCountQueryBuilder(result: CountResult): CountQueryBuilder {
  // thenable 객체로 await 시 result 반환
  const builder = {} as CountQueryBuilder;
  builder.select = jest.fn().mockReturnValue(builder);
  builder.eq = jest.fn().mockReturnValue(builder);
  builder.is = jest.fn().mockReturnValue(builder);
  builder.then = (onFulfilled) => Promise.resolve(result).then(onFulfilled);
  return builder;
}

describe('DashboardService', () => {
  let service: DashboardService;
  let fromMock: jest.Mock;
  let rpcMock: jest.Mock;
  // 테스트 케이스별로 from() 결과를 순서대로 반환하기 위한 큐
  let fromQueue: ReturnType<typeof createCountQueryBuilder>[];
  // 테스트 케이스별로 rpc() 결과를 키별로 반환하기 위한 맵
  let rpcResults: Map<string, RpcResult<unknown>>;
  let lastFromCalls: string[];
  let lastRpcCalls: Array<{ name: string; args: Record<string, unknown> }>;

  beforeEach(async () => {
    fromQueue = [];
    rpcResults = new Map();
    lastFromCalls = [];
    lastRpcCalls = [];

    fromMock = jest.fn((tableName: string) => {
      lastFromCalls.push(tableName);
      const next = fromQueue.shift();
      if (!next) {
        throw new Error(`Unexpected from(${tableName}) — fromQueue exhausted`);
      }
      return next;
    });

    rpcMock = jest.fn((name: string, args: Record<string, unknown>) => {
      lastRpcCalls.push({ name, args });
      const result = rpcResults.get(name);
      if (!result) {
        throw new Error(`Unexpected rpc(${name}) — no mock registered`);
      }
      return Promise.resolve(result);
    });

    const supabaseService = {
      admin: {
        from: fromMock,
        rpc: rpcMock,
      },
    } as unknown as SupabaseService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: SupabaseService, useValue: supabaseService },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  describe('getKpis', () => {
    it('4개 쿼리(entries / user_concepts ×2 / get_user_streak RPC)를 호출하고 응답을 합쳐 반환', async () => {
      fromQueue.push(
        createCountQueryBuilder({ count: 7, error: null }), // entries
        createCountQueryBuilder({ count: 12, error: null }), // user_concepts (total)
        createCountQueryBuilder({ count: 3, error: null }), // user_concepts (mastered)
      );
      rpcResults.set('get_user_streak', { data: 5, error: null });

      const result = await service.getKpis(TEST_USER_ID);

      expect(result).toEqual({
        totalEntries: 7,
        totalConcepts: 12,
        masteredConcepts: 3,
        currentStreak: 5,
      });
      expect(lastFromCalls).toEqual([
        'entries',
        'user_concepts',
        'user_concepts',
      ]);
      expect(lastRpcCalls).toEqual([
        { name: 'get_user_streak', args: { p_user_id: TEST_USER_ID } },
      ]);
    });

    it('count 가 null 이거나 streak.data 가 null 이면 0 으로 fallback', async () => {
      fromQueue.push(
        createCountQueryBuilder({ count: null, error: null }),
        createCountQueryBuilder({ count: null, error: null }),
        createCountQueryBuilder({ count: null, error: null }),
      );
      rpcResults.set('get_user_streak', { data: null, error: null });

      const result = await service.getKpis(TEST_USER_ID);

      expect(result).toEqual({
        totalEntries: 0,
        totalConcepts: 0,
        masteredConcepts: 0,
        currentStreak: 0,
      });
    });

    it('entries count 쿼리가 실패하면 InternalServerErrorException', async () => {
      fromQueue.push(
        createCountQueryBuilder({
          count: null,
          error: { message: 'entries failed' },
        }),
        createCountQueryBuilder({ count: 0, error: null }),
        createCountQueryBuilder({ count: 0, error: null }),
      );
      rpcResults.set('get_user_streak', { data: 0, error: null });

      await expect(service.getKpis(TEST_USER_ID)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('streak RPC가 실패하면 InternalServerErrorException', async () => {
      fromQueue.push(
        createCountQueryBuilder({ count: 0, error: null }),
        createCountQueryBuilder({ count: 0, error: null }),
        createCountQueryBuilder({ count: 0, error: null }),
      );
      rpcResults.set('get_user_streak', {
        data: null,
        error: { message: 'streak failed' },
      });

      await expect(service.getKpis(TEST_USER_ID)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('getConceptGrowth', () => {
    it('get_concept_growth RPC를 올바른 인자로 호출하고 결과를 매핑', async () => {
      const fakeRows = [
        { date: '2026-04-25', cumulative: 1 },
        { date: '2026-04-26', cumulative: 2 },
        { date: '2026-04-27', cumulative: 4 },
      ];
      rpcResults.set('get_concept_growth', { data: fakeRows, error: null });

      const result = await service.getConceptGrowth(TEST_USER_ID, 90);

      expect(result).toEqual(fakeRows);
      expect(lastRpcCalls).toEqual([
        {
          name: 'get_concept_growth',
          args: { p_user_id: TEST_USER_ID, p_days: 90 },
        },
      ]);
    });

    it('RPC가 null을 반환하면 빈 배열', async () => {
      rpcResults.set('get_concept_growth', { data: null, error: null });

      const result = await service.getConceptGrowth(TEST_USER_ID, 30);

      expect(result).toEqual([]);
      expect(lastRpcCalls[0]?.args).toEqual({
        p_user_id: TEST_USER_ID,
        p_days: 30,
      });
    });

    it('RPC가 에러를 반환하면 InternalServerErrorException', async () => {
      rpcResults.set('get_concept_growth', {
        data: null,
        error: { message: 'rpc failed' },
      });

      await expect(
        service.getConceptGrowth(TEST_USER_ID, 90),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getEntryHeatmap', () => {
    it('get_entry_heatmap RPC를 올바른 인자로 호출', async () => {
      const fakeRows = [
        { date: '2026-04-26', count: 2 },
        { date: '2026-04-27', count: 1 },
      ];
      rpcResults.set('get_entry_heatmap', { data: fakeRows, error: null });

      const result = await service.getEntryHeatmap(TEST_USER_ID, 91);

      expect(result).toEqual(fakeRows);
      expect(lastRpcCalls).toEqual([
        {
          name: 'get_entry_heatmap',
          args: { p_user_id: TEST_USER_ID, p_days: 91 },
        },
      ]);
    });

    it('RPC가 null이면 빈 배열', async () => {
      rpcResults.set('get_entry_heatmap', { data: null, error: null });

      const result = await service.getEntryHeatmap(TEST_USER_ID, 14);

      expect(result).toEqual([]);
    });

    it('RPC가 에러를 반환하면 InternalServerErrorException', async () => {
      rpcResults.set('get_entry_heatmap', {
        data: null,
        error: { message: 'rpc failed' },
      });

      await expect(
        service.getEntryHeatmap(TEST_USER_ID, 91),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
