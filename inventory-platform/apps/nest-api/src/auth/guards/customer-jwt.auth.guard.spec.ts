import { UserRole } from '@workspace/db';
import { CustomerJwtAuthGuard } from './customer-jwt.auth.guard';

function context(request: Record<string, unknown>) {
  return { switchToHttp: () => ({ getRequest: () => request }) } as never;
}

describe('CustomerJwtAuthGuard', () => {
  const verifiedUser = {
    id: 'supabase-user-1',
    email: 'owner@example.com',
    user_metadata: { firstName: 'Project', lastName: 'Owner' },
  };

  function setup(existing: { id: string; email: string; role: UserRole } | null) {
    const upsert = jest.fn().mockResolvedValue({
      id: verifiedUser.id,
      email: verifiedUser.email,
      role: UserRole.CUSTOMER,
    });
    const prisma = {
      client: { user: { findUnique: jest.fn().mockResolvedValue(existing), upsert } },
    };
    const config = {
      get: jest.fn((key: string) => key === 'SUPABASE_URL' ? 'https://project.supabase.co' : key === 'SUPABASE_PUBLISHABLE_KEY' ? 'sb_publishable_test' : undefined),
    };
    const guard = new CustomerJwtAuthGuard(config as never, prisma as never);
    (guard as unknown as { supabase: { auth: { getUser: jest.Mock } } }).supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: verifiedUser }, error: null }) },
    };
    return { guard, upsert };
  }

  it('preserves a staff role while allowing verified-email customer access', async () => {
    const admin = { id: verifiedUser.id, email: verifiedUser.email, role: UserRole.ADMIN };
    const { guard, upsert } = setup(admin);
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer valid-token' } };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(upsert).not.toHaveBeenCalled();
    expect(request.user).toEqual({ id: admin.id, email: verifiedUser.email, databaseRole: UserRole.ADMIN });
  });

  it('creates a customer profile for a new verified identity', async () => {
    const { guard, upsert } = setup(null);
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer valid-token' } };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ id: verifiedUser.id, role: UserRole.CUSTOMER }),
    }));
    expect(request.user).toEqual({ id: verifiedUser.id, email: verifiedUser.email, databaseRole: UserRole.CUSTOMER });
  });
});
