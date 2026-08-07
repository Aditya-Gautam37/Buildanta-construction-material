import { OptionalCustomerJwtAuthGuard } from './optional-customer-jwt.auth.guard';
import type { CustomerJwtAuthGuard } from './customer-jwt.auth.guard';

function context(request: Record<string, unknown>) {
  return { switchToHttp: () => ({ getRequest: () => request }) } as never;
}

describe('OptionalCustomerJwtAuthGuard', () => {
  it('passes through the resolved user when the inner guard succeeds', async () => {
    const inner = {
      canActivate: jest.fn(async (ctx) => {
        ctx.switchToHttp().getRequest().user = { id: 'customer-1', email: 'a@b.com' };
        return true;
      }),
    } as unknown as CustomerJwtAuthGuard;
    const guard = new OptionalCustomerJwtAuthGuard(inner);
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer valid' } };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'customer-1', email: 'a@b.com' });
  });

  it('treats a missing bearer token as a guest instead of rejecting', async () => {
    const inner = {
      canActivate: jest.fn().mockRejectedValue(new Error('Missing bearer token.')),
    } as unknown as CustomerJwtAuthGuard;
    const guard = new OptionalCustomerJwtAuthGuard(inner);
    const request: Record<string, unknown> = { headers: {} };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request.user).toBeNull();
  });

  it('treats an invalid or expired token as a guest instead of rejecting', async () => {
    const inner = {
      canActivate: jest.fn().mockRejectedValue(new Error('Invalid or expired customer session.')),
    } as unknown as CustomerJwtAuthGuard;
    const guard = new OptionalCustomerJwtAuthGuard(inner);
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer stale' } };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request.user).toBeNull();
  });
});
