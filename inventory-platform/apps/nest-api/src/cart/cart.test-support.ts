// Shared between cart.service.spec.ts (unit tests against CartService
// directly) and test/cart.e2e-spec.ts (route-wiring/guard/pipe/throttle
// tests through a real HTTP stack) — both need the exact same in-memory
// stand-in for Prisma, never a real database connection.
import { CartStatus, Prisma, ProductStatus, PurchaseMode, VariantStatus } from '@workspace/db';

export function fakePrismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('simulated', { code, clientVersion: '0.0.0' });
}

export type FakeVariant = {
  id: string;
  productId: string;
  sku: string;
  price: number;
  unit: string;
  purchaseMode: PurchaseMode;
  minimumOrderQuantity: number;
  maxDirectQuantity: number | null;
  bulkQuoteThreshold: number | null;
  quantityIncrement: number;
  stockTracked: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  status: VariantStatus;
  inventoryBalances: Array<{
    physicalQuantity: number;
    reservedQuantity: number;
    blockedQuantity: number;
    damagedQuantity: number;
    quarantineQuantity: number;
    lowStockThreshold: number;
  }>;
  product: { id: string; name: string; status: ProductStatus; sellingPrice: number; gstPercent?: number | null; images?: Array<{ src: string }> };
};

export function makeVariant(overrides: Partial<FakeVariant> = {}): FakeVariant {
  return {
    id: 'variant-1',
    productId: 'product-1',
    sku: 'SKU-1',
    price: 100,
    unit: 'bag',
    purchaseMode: PurchaseMode.DIRECT_ONLY,
    minimumOrderQuantity: 1,
    maxDirectQuantity: null,
    bulkQuoteThreshold: null,
    quantityIncrement: 1,
    stockTracked: true,
    stockQuantity: 100,
    reservedQuantity: 0,
    lowStockThreshold: 5,
    status: VariantStatus.ACTIVE,
    inventoryBalances: [{
      physicalQuantity: 100,
      reservedQuantity: 0,
      blockedQuantity: 0,
      damagedQuantity: 0,
      quarantineQuantity: 0,
      lowStockThreshold: 5,
    }],
    product: { id: 'product-1', name: 'Test Product', status: ProductStatus.PUBLISHED, sellingPrice: 100, images: [] },
    ...overrides,
  };
}

function matchesWhere(row: Record<string, unknown>, where: Record<string, unknown>) {
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    if (value && typeof value === 'object' && 'not' in (value as Record<string, unknown>)) {
      return row[key] !== (value as { not: unknown }).not;
    }
    return row[key] === value;
  });
}

export function createFakePrisma() {
  let cartSeq = 0;
  let itemSeq = 0;
  const carts = new Map<string, any>();
  const cartItems = new Map<string, any>();
  const variants = new Map<string, FakeVariant>();

  function attach(row: any) {
    const items = [...cartItems.values()]
      .filter((item) => item.cartId === row.id)
      .map((item) => ({ ...item, variant: variants.get(item.variantId) }));
    return { ...row, items };
  }

  const cart = {
    findFirst: jest.fn(async ({ where }: any) => {
      const all = [...carts.values()].filter((row) => matchesWhere(row, where));
      all.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      return all[0] ? attach(all[0]) : null;
    }),
    create: jest.fn(async ({ data }: any) => {
      const id = `cart-${++cartSeq}`;
      const now = new Date();
      const row = {
        id,
        status: CartStatus.ACTIVE,
        currency: 'INR',
        conversionIdempotencyKey: null,
        convertedAt: null,
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now,
        customerId: null,
        guestToken: null,
        quotation: null,
        ...data,
      };
      carts.set(id, row);
      return attach(row);
    }),
    update: jest.fn(async ({ where, data }: any) => {
      const row = carts.get(where.id);
      Object.assign(row, data, { updatedAt: new Date() });
      return attach(row);
    }),
    updateMany: jest.fn(async ({ where, data }: any) => {
      const matched = [...carts.values()].filter((row) => matchesWhere(row, where));
      for (const row of matched) Object.assign(row, data, { updatedAt: new Date() });
      return { count: matched.length };
    }),
  };

  const cartItem = {
    upsert: jest.fn(async ({ where, create, update }: any) => {
      const key = where.cartId_variantId;
      const existing = [...cartItems.values()].find((item) => item.cartId === key.cartId && item.variantId === key.variantId);
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      const id = `item-${++itemSeq}`;
      const now = new Date();
      const row = { id, addedAt: now, updatedAt: now, ...create };
      cartItems.set(id, row);
      return row;
    }),
    update: jest.fn(async ({ where, data }: any) => {
      const row = cartItems.get(where.id);
      Object.assign(row, data, { updatedAt: new Date() });
      return row;
    }),
    delete: jest.fn(async ({ where }: any) => {
      const row = cartItems.get(where.id);
      cartItems.delete(where.id);
      return row;
    }),
    deleteMany: jest.fn(async ({ where }: any) => {
      const toDelete = [...cartItems.values()].filter((item) => item.cartId === where.cartId);
      for (const item of toDelete) cartItems.delete(item.id);
      return { count: toDelete.length };
    }),
  };

  const productVariant = {
    findUnique: jest.fn(async ({ where }: any) => variants.get(where.id) ?? null),
    update: jest.fn(async ({ where, data }: any) => {
      const variant = variants.get(where.id);
      if (variant) Object.assign(variant, data);
      return variant;
    }),
  };

  // --- Checkout-only fakes below. Deliberately minimal: each mirrors just
  // enough Prisma behaviour for CartService.checkout() to run, seeded per test
  // rather than trying to be a general-purpose in-memory Postgres.
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}-${++seq}`;
  const serviceableAreas = new Set<string>(); // pincodes that resolve to a service area
  const serviceableLocations = new Map<string, string>(); // fulfilmentLocationId -> pincode set marker
  const balances = new Map<string, any>(); // keyed by `${variantId}:${fulfilmentLocationId}`
  const reservations: any[] = [];
  const ledgerEntries: any[] = [];
  const salesOrders = new Map<string, any>();
  const salesOrderItems: any[] = [];

  function seedServiceable(pincode: string, fulfilmentLocationId = 'loc-1') {
    serviceableAreas.add(pincode);
    serviceableLocations.set(fulfilmentLocationId, pincode);
  }
  function seedBalance(variantId: string, fulfilmentLocationId: string, physical: number, reserved = 0) {
    const id = `${variantId}:${fulfilmentLocationId}`;
    balances.set(id, {
      id, variantId, fulfilmentLocationId,
      physicalQuantity: physical, reservedQuantity: reserved,
      blockedQuantity: 0, damagedQuantity: 0, quarantineQuantity: 0, inTransitQuantity: 0,
      lowStockThreshold: 5,
    });
  }

  const pincodeCoverage = {
    findMany: jest.fn(async ({ where }: any) => (serviceableAreas.has(where.pincode) ? [{ serviceAreaId: 'area-1' }] : [])),
    findFirst: jest.fn(async ({ where }: any) => (serviceableAreas.has(where.pincode) ? { id: 'coverage-1' } : null)),
  };
  const fulfilmentServiceArea = {
    findMany: jest.fn(async ({ where }: any) => {
      const pincode = where?.serviceArea?.pincodes?.some?.pincode;
      if (!serviceableAreas.has(pincode)) return [];
      return [...serviceableLocations.keys()].map((fulfilmentLocationId) => ({ fulfilmentLocationId }));
    }),
  };
  const inventoryBalance = {
    findMany: jest.fn(async ({ where }: any) => {
      const locationIds: string[] = where.fulfilmentLocationId.in;
      return [...balances.values()].filter((row) => row.variantId === where.variantId && locationIds.includes(row.fulfilmentLocationId));
    }),
    findUniqueOrThrow: jest.fn(async ({ where }: any) => {
      const row = [...balances.values()].find((candidate) => candidate.id === where.id);
      if (!row) throw new Error('balance not found');
      return row;
    }),
    update: jest.fn(async ({ where, data }: any) => {
      const row = [...balances.values()].find((candidate) => candidate.id === where.id)!;
      if (data.reservedQuantity?.increment) row.reservedQuantity += data.reservedQuantity.increment;
      return { ...row };
    }),
    aggregate: jest.fn(async ({ where }: any) => {
      const rows = [...balances.values()].filter((row) => row.variantId === where.variantId);
      return {
        _sum: {
          physicalQuantity: rows.reduce((sum, row) => sum + row.physicalQuantity, 0),
          reservedQuantity: rows.reduce((sum, row) => sum + row.reservedQuantity, 0),
        },
      };
    }),
  };
  const quotations = new Map<string, any>();
  const quotation = {
    create: jest.fn(async ({ data }: any) => {
      const id = nextId('quotation');
      const items = (data.items?.create ?? []).map((item: any) => ({ id: nextId('qitem'), ...item }));
      const row = { ...data, id, items };
      quotations.set(id, row);
      return row;
    }),
    update: jest.fn(async ({ where, data }: any) => {
      const row = quotations.get(where.id);
      Object.assign(row, data);
      return row;
    }),
  };
  const quotationRevision = { create: jest.fn(async ({ data }: any) => ({ id: nextId('revision'), ...data })) };
  const quotationApproval = { create: jest.fn(async ({ data }: any) => ({ id: nextId('approval'), ...data })) };
  const salesOrder = {
    create: jest.fn(async ({ data }: any) => {
      const id = nextId('order');
      const row = { id, ...data };
      salesOrders.set(id, row);
      return row;
    }),
  };
  const salesOrderItem = {
    create: jest.fn(async ({ data }: any) => {
      const row = { id: nextId('orderitem'), ...data };
      salesOrderItems.push(row);
      return row;
    }),
  };
  const inventoryReservation = { create: jest.fn(async ({ data }: any) => { const row = { id: nextId('reservation'), ...data }; reservations.push(row); return row; }) };
  const inventoryLedgerEntry = { create: jest.fn(async ({ data }: any) => { const row = { id: nextId('ledger'), ...data }; ledgerEntries.push(row); return row; }) };

  const client: any = {
    cart, cartItem, productVariant,
    pincodeCoverage, fulfilmentServiceArea, inventoryBalance,
    quotation, quotationRevision, quotationApproval,
    salesOrder, salesOrderItem, inventoryReservation, inventoryLedgerEntry,
  };
  // Real Prisma rolls back every write the moment the callback throws. Without
  // that, a test asserting "a mid-transaction failure leaves no partial order"
  // would pass for the wrong reason (nothing thrown) or fail for the wrong
  // reason (this fake, not the code under test) — so the fake snapshots every
  // mutable store before running the callback and restores on throw.
  const mutableStores: Array<Map<string, any>> = [carts, cartItems, variants, balances, quotations, salesOrders];
  const mutableLists: Array<any[]> = [reservations, ledgerEntries, salesOrderItems];
  client.$transaction = jest.fn(async (callback: any) => {
    const storeSnapshots = mutableStores.map((map) => structuredClone([...map.entries()]));
    const listSnapshots = mutableLists.map((list) => structuredClone(list));
    try {
      return await callback(client);
    } catch (error) {
      mutableStores.forEach((map, index) => {
        map.clear();
        for (const [id, value] of storeSnapshots[index]!) map.set(id, value);
      });
      mutableLists.forEach((list, index) => {
        list.length = 0;
        list.push(...listSnapshots[index]!);
      });
      throw error;
    }
  });

  return {
    client, carts, cartItems, variants,
    seedServiceable, seedBalance, balances, reservations, ledgerEntries, salesOrders, salesOrderItems,
  };
}
