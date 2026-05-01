import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { SupabaseService } from '@/supabase/supabase.service';

import { SupabaseAuthGuard } from './supabase-auth.guard';

type GetUserResult = {
  data: { user: unknown };
  error: unknown;
};

const buildContext = (request: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

const buildSupabaseStub = (result: GetUserResult): SupabaseService =>
  ({
    anon: {
      auth: {
        getUser: jest.fn().mockResolvedValue(result),
      },
    },
  }) as unknown as SupabaseService;

describe('SupabaseAuthGuard', () => {
  it('throws UnauthorizedException when no token is provided', async () => {
    const guard = new SupabaseAuthGuard(
      buildSupabaseStub({ data: { user: null }, error: null }),
    );
    const context = buildContext({ headers: {}, query: {} });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when supabase returns an error', async () => {
    const guard = new SupabaseAuthGuard(
      buildSupabaseStub({
        data: { user: null },
        error: new Error('invalid token'),
      }),
    );
    const context = buildContext({
      headers: { authorization: 'Bearer bad-token' },
      query: {},
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches user and returns true for a valid Bearer token', async () => {
    const user = { id: 'user-1' };
    const supabase = buildSupabaseStub({ data: { user }, error: null });
    const guard = new SupabaseAuthGuard(supabase);
    const request: {
      headers: Record<string, string>;
      query: Record<string, string>;
      user?: unknown;
    } = {
      headers: { authorization: 'Bearer good-token' },
      query: {},
    };

    const result = await guard.canActivate(buildContext(request));

    expect(result).toBe(true);
    expect(request.user).toEqual(user);
    expect(supabase.anon.auth.getUser).toHaveBeenCalledWith('good-token');
  });

  it('accepts token from ?token= query parameter when no Authorization header', async () => {
    const user = { id: 'user-2' };
    const supabase = buildSupabaseStub({ data: { user }, error: null });
    const guard = new SupabaseAuthGuard(supabase);
    const request: {
      headers: Record<string, string>;
      query: Record<string, string>;
      user?: unknown;
    } = {
      headers: {},
      query: { token: 'query-token' },
    };

    const result = await guard.canActivate(buildContext(request));

    expect(result).toBe(true);
    expect(supabase.anon.auth.getUser).toHaveBeenCalledWith('query-token');
  });
});
