import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CartStatus, ProductStatus, PurchaseMode, VariantStatus } from '@workspace/db';
import { CartService } from './cart.service';

type FakeVariant = {
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

function makeVariant(overrides: Partial<FakeVariant> = {}): FakeVariant {
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
  return Object.entries(where).every(([key, value]) => value === undefined || row[key] === value);
}

function createFakePrisma() {
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
  };
  const fulfilmentServiceArea = {
    findMany: jest.fn(async () => [...serviceableLocations.keys()].map((fulfilmentLocationId) => ({ fulfilmentLocationId }))),
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
  client.$transaction = jest.fn((callback: any) => callback(client));

  return {
    client, carts, cartItems, variants,
    seedServiceable, seedBalance, balances, reservations, ledgerEntries, salesOrders, salesOrderItems,
  };
}

function setup() {
  const fake = createFakePrisma();
  const quoteRequestsService = { create: jest.fn() };
  const service = new CartService({ client: fake.client } as never, quoteRequestsService as never);
  return { service, quoteRequestsService, ...fake };
}

describe('CartService', () => {
  it('returns an empty summary when no cart exists for the identity', async () => {
    const { service } = setup();
    const summary = await service.getSummary({ guestToken: 'guest-none' });
    expect(summary).toMatchObject({ cartId: null, lineCount: 0, itemCount: 0, subtotal: 0 });
  });

  it('creates a cart on first add and reuses it, summing quantity on repeat adds', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant());

    const first = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 2 });
    expect(first.lineCount).toBe(1);
    expect(first.itemCount).toBe(2);

    const second = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 3 });
    expect(second.cartId).toBe(first.cartId);
    expect(second.itemCount).toBe(5);
  });

  it('rejects adding a quote-only variant', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({ purchaseMode: PurchaseMode.QUOTE_ONLY }));

    await expect(
      service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects adding a discontinued variant', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({ status: VariantStatus.DISCONTINUED }));

    await expect(
      service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects adding a variant from an unpublished product', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({ product: { id: 'product-1', name: 'Test Product', status: ProductStatus.DRAFT, sellingPrice: 100, images: [] } }));

    await expect(
      service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('clamps cumulative quantity to maxDirectQuantity across repeat adds', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({ maxDirectQuantity: 6 }));

    await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 5 });
    const summary = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 5 });
    expect(summary.itemCount).toBe(6);
  });

  it('returns the minimum-order-quantity adjustment from addItem', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({ minimumOrderQuantity: 5 }));

    const summary = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 2 });

    expect(summary.itemCount).toBe(5);
    expect(summary.adjustment).toMatchObject({
      requestedQuantity: 2,
      adjustedQuantity: 5,
      reasons: ['MINIMUM_ORDER_QUANTITY'],
      message: 'Quantity adjusted from 2 to 5 because the minimum order quantity is 5.',
    });
  });

  it('returns the quantity-increment adjustment from updateItem', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({ quantityIncrement: 5, minimumOrderQuantity: 5 }));
    const added = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 5 });

    const updated = await service.updateItem({ guestToken: 'guest-1' }, added.lines[0]!.itemId, 7);

    expect(updated.itemCount).toBe(10);
    expect(updated.adjustment).toMatchObject({
      requestedQuantity: 7,
      adjustedQuantity: 10,
      reasons: ['QUANTITY_INCREMENT'],
      message: 'Quantity adjusted from 7 to 10 because this product is sold in increments of 5.',
    });
  });

  it('returns the maximum-direct-quantity adjustment from updateItem', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({ maxDirectQuantity: 50 }));
    const added = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 1 });

    const updated = await service.updateItem({ guestToken: 'guest-1' }, added.lines[0]!.itemId, 100);

    expect(updated.itemCount).toBe(50);
    expect(updated.adjustment).toMatchObject({
      requestedQuantity: 100,
      adjustedQuantity: 50,
      reasons: ['MAXIMUM_DIRECT_QUANTITY'],
      message: 'Quantity adjusted from 100 to 50 because the maximum direct-order quantity is 50.',
    });
  });

  it('reports no adjustment when the requested quantity is already valid', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant());

    const summary = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 3 });

    expect(summary.adjustment).toBeNull();
  });

  it('does not replay a past adjustment on a later read of the cart', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({ minimumOrderQuantity: 5 }));
    const added = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 2 });
    expect(added.adjustment).not.toBeNull();

    const reread = await service.getSummary({ guestToken: 'guest-1' });

    expect(reread.lines[0]!.adjustment).toBeNull();
    expect(reread.lines[0]!.issues).toEqual([]);
  });

  it('surfaces a line adjustment when the rules changed after the item was added', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({ minimumOrderQuantity: 1 }));
    await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 2 });

    // Staff later raises the minimum order quantity above the stored quantity.
    variants.set('variant-1', makeVariant({ minimumOrderQuantity: 10 }));
    const reread = await service.getSummary({ guestToken: 'guest-1' });

    expect(reread.lines[0]!.quantity).toBe(10);
    expect(reread.lines[0]!.adjustment?.message).toBe(
      'Quantity adjusted from 2 to 10 because the minimum order quantity is 10.',
    );
  });

  it('does not count damaged or quarantined stock as available', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({
      // The rollup columns still look healthy, but almost all of it is unsellable.
      stockQuantity: 100,
      reservedQuantity: 0,
      inventoryBalances: [{
        physicalQuantity: 100,
        reservedQuantity: 0,
        blockedQuantity: 10,
        damagedQuantity: 60,
        quarantineQuantity: 30,
        lowStockThreshold: 5,
      }],
    }));

    const summary = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 1 });

    expect(summary.lines[0]!.availability).toBe('OUT_OF_STOCK');
  });

  it('reports low stock once usable quantity falls to the threshold', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({
      inventoryBalances: [{
        physicalQuantity: 20,
        reservedQuantity: 5,
        blockedQuantity: 0,
        damagedQuantity: 10,
        quarantineQuantity: 0,
        lowStockThreshold: 5,
      }],
    }));

    const summary = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 1 });

    expect(summary.lines[0]!.availability).toBe('LOW_STOCK');
  });

  it('falls back to enquiry when a variant has no stock records at all', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant({ inventoryBalances: [] }));

    const summary = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 1 });

    expect(summary.lines[0]!.availability).toBe('ENQUIRY');
  });

  it('enforces cart ownership when updating or removing a line item', async () => {
    const { service, variants } = setup();
    variants.set('variant-1', makeVariant());
    const ownerSummary = await service.addItem({ guestToken: 'owner' }, { variantId: 'variant-1', quantity: 1 });
    await service.addItem({ guestToken: 'intruder' }, { variantId: 'variant-1', quantity: 1 });
    const ownedItemId = ownerSummary.lines[0]!.itemId;

    await expect(service.updateItem({ guestToken: 'intruder' }, ownedItemId, 5)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.removeItem({ guestToken: 'intruder' }, ownedItemId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks mutation on a cart that is no longer active', async () => {
    const { service, variants, carts } = setup();
    variants.set('variant-1', makeVariant());
    const summary = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 1 });
    for (const row of carts.values()) row.status = CartStatus.CONVERTED;

    await expect(service.updateItem({ guestToken: 'guest-1' }, summary.lines[0]!.itemId, 2)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.removeItem({ guestToken: 'guest-1' }, summary.lines[0]!.itemId)).rejects.toBeInstanceOf(ConflictException);
  });

  it('excludes quote-required lines from the subtotal and flags stale price snapshots', async () => {
    const { service, variants, cartItems } = setup();
    variants.set('variant-direct', makeVariant({ id: 'variant-direct', price: 20, unit: 'bag' }));
    variants.set('variant-quote', makeVariant({
      id: 'variant-quote',
      price: 50,
      purchaseMode: PurchaseMode.DIRECT_AND_QUOTE,
      bulkQuoteThreshold: 10,
    }));

    await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-direct', quantity: 3 });
    const summary = await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-quote', quantity: 15 });

    const quoteLine = summary.lines.find((line) => line.variantId === 'variant-quote')!;
    expect(quoteLine.requiresQuote).toBe(true);
    expect(quoteLine.lineSubtotal).toBeNull();
    expect(summary.subtotal).toBe(60);

    for (const item of cartItems.values()) if (item.variantId === 'variant-direct') item.unitPriceSnapshot = 15;
    const restale = await service.getSummary({ guestToken: 'guest-1' });
    const directLine = restale.lines.find((line) => line.variantId === 'variant-direct')!;
    expect(directLine.priceChanged).toBe(true);
  });

  it('merges a guest cart into the customer cart on login and abandons the guest cart', async () => {
    const { service, variants, carts } = setup();
    variants.set('variant-1', makeVariant());
    await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 2 });

    const merged = await service.merge('customer-1', 'guest-1');
    expect(merged.itemCount).toBe(2);

    const guestCartRow = [...carts.values()].find((row) => row.customerId === null && row.status === CartStatus.ABANDONED);
    expect(guestCartRow).toBeTruthy();
    expect(guestCartRow.guestToken).toBeNull();
  });

  describe('convertToQuote', () => {
    it('converts an eligible cart and marks it CONVERTED', async () => {
      const { service, variants, quoteRequestsService } = setup();
      variants.set('variant-1', makeVariant());
      await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 4 });
      quoteRequestsService.create.mockResolvedValue({ reference: 'BQ-1', itemCount: 1 });

      const result = await service.convertToQuote({ guestToken: 'guest-1' }, {
        name: 'Aditi', email: 'a@b.com', phone: '9999999999', deliveryPincode: '208016', idempotencyKey: 'key-1',
      });

      expect(result).toEqual({ reference: 'BQ-1', itemCount: 1 });
      expect(quoteRequestsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ items: [expect.objectContaining({ variantId: 'variant-1', quantity: 4 })] }),
        expect.anything(),
        { sourceCartId: expect.any(String) },
      );

      const summaryAfter = await service.getSummary({ guestToken: 'guest-1' });
      expect(summaryAfter.cartId).toBeNull();
    });

    it('returns the existing quotation on a same-key retry instead of converting again', async () => {
      const { service, variants, quoteRequestsService, carts } = setup();
      variants.set('variant-1', makeVariant());
      await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 1 });
      quoteRequestsService.create.mockResolvedValue({ reference: 'BQ-1', itemCount: 1 });
      await service.convertToQuote({ guestToken: 'guest-1' }, {
        name: 'Aditi', email: 'a@b.com', phone: '9999999999', deliveryPincode: '208016', idempotencyKey: 'key-1',
      });
      for (const row of carts.values()) row.quotation = { reference: 'BQ-1', items: [{}] };

      const retry = await service.convertToQuote({ guestToken: 'guest-1' }, {
        name: 'Aditi', email: 'a@b.com', phone: '9999999999', deliveryPincode: '208016', idempotencyKey: 'key-1',
      });

      expect(retry).toEqual({ reference: 'BQ-1', itemCount: 1, existing: true });
      expect(quoteRequestsService.create).toHaveBeenCalledTimes(1);
    });

    it('rejects a retry with a different idempotency key', async () => {
      const { service, variants, quoteRequestsService, carts } = setup();
      variants.set('variant-1', makeVariant());
      await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 1 });
      quoteRequestsService.create.mockResolvedValue({ reference: 'BQ-1', itemCount: 1 });
      await service.convertToQuote({ guestToken: 'guest-1' }, {
        name: 'Aditi', email: 'a@b.com', phone: '9999999999', deliveryPincode: '208016', idempotencyKey: 'key-1',
      });
      for (const row of carts.values()) row.quotation = { reference: 'BQ-1', items: [{}] };

      await expect(service.convertToQuote({ guestToken: 'guest-1' }, {
        name: 'Aditi', email: 'a@b.com', phone: '9999999999', deliveryPincode: '208016', idempotencyKey: 'key-2',
      })).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects converting an empty or missing cart', async () => {
      const { service } = setup();
      await expect(service.convertToQuote({ guestToken: 'guest-none' }, {
        name: 'Aditi', email: 'a@b.com', phone: '9999999999', deliveryPincode: '208016', idempotencyKey: 'key-1',
      })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // checkout() is the reservation fix: unlike convertToQuote (a request for
  // staff to price by hand), it must synthesise an already-priced quotation,
  // accept it, and actually move stock from available into reserved in the
  // same transaction — or a "confirmed" order is just a promise nothing backs.
  describe('checkout', () => {
    const address = {
      name: 'Aditi', email: 'a@b.com', phone: '9999999999',
      addressLine1: '12 Test Road', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208001',
      deliveryMethod: 'STANDARD' as const, idempotencyKey: 'checkout-key-1',
    };

    it('reserves real stock and confirms the order at the correct total', async () => {
      const { service, variants, seedServiceable, seedBalance, balances, reservations, salesOrders } = setup();
      variants.set('variant-1', makeVariant({ price: 414, unit: 'bag', product: { id: 'product-1', name: 'Cement', status: ProductStatus.PUBLISHED, sellingPrice: 414, images: [] } }));
      seedServiceable('208001', 'loc-1');
      seedBalance('variant-1', 'loc-1', 500, 0);
      await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 10 });

      const result = await service.checkout({ guestToken: 'guest-1' }, address);

      expect(result.existing).toBe(false);
      expect(result.orderReference).toMatch(/^SO-/);
      expect(result.grandTotal).toBe(4140); // 10 x 414, no GST configured, free standard delivery
      expect(result.deliveryCharge).toBe(0);

      const balance = balances.get('variant-1:loc-1');
      expect(balance.reservedQuantity).toBe(10); // stock actually moved, not just recorded
      expect(reservations).toHaveLength(1);
      expect(reservations[0]).toMatchObject({ quantity: 10, fulfilmentLocationId: 'loc-1' });
      expect(salesOrders.size).toBe(1);

      const cartAfter = await service.getSummary({ guestToken: 'guest-1' });
      expect(cartAfter.cartId).toBeNull(); // cart converted, not left dangling
    });

    it('includes GST and the priority delivery charge in the total', async () => {
      const { service, variants, seedServiceable, seedBalance } = setup();
      variants.set('variant-1', makeVariant({
        price: 1000, unit: 'unit',
        product: { id: 'product-1', name: 'Taxed Item', status: ProductStatus.PUBLISHED, sellingPrice: 1000, gstPercent: 18, images: [] },
      }));
      seedServiceable('208001', 'loc-1');
      seedBalance('variant-1', 'loc-1', 100, 0);
      await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 2 });

      const result = await service.checkout({ guestToken: 'guest-1' }, { ...address, deliveryMethod: 'EXPRESS' });

      // 2 x 1000 = 2000 subtotal, 18% GST = 360, + 400 express = 2760
      expect(result.deliveryCharge).toBe(400);
      expect(result.grandTotal).toBe(2760);
    });

    it('refuses checkout to a PIN code nothing serves', async () => {
      const { service, variants, seedBalance } = setup();
      variants.set('variant-1', makeVariant());
      seedBalance('variant-1', 'loc-1', 100, 0);
      await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 1 });

      await expect(service.checkout({ guestToken: 'guest-1' }, { ...address, pincode: '999999' }))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('reports the exact shortfall instead of overselling', async () => {
      const { service, variants, seedServiceable, seedBalance, reservations } = setup();
      variants.set('variant-1', makeVariant());
      seedServiceable('208001', 'loc-1');
      seedBalance('variant-1', 'loc-1', 5, 0); // only 5 physically on the shelf
      await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 20 });

      await expect(service.checkout({ guestToken: 'guest-1' }, address)).rejects.toThrow(/only 5 .* available/i);
      expect(reservations).toHaveLength(0); // nothing reserved on a failed checkout
    });

    it('will not reserve stock already claimed by someone else\'s reservation', async () => {
      const { service, variants, seedServiceable, seedBalance } = setup();
      variants.set('variant-1', makeVariant());
      seedServiceable('208001', 'loc-1');
      seedBalance('variant-1', 'loc-1', 10, 8); // 10 physical, 8 already reserved -> 2 available
      await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 5 });

      await expect(service.checkout({ guestToken: 'guest-1' }, address)).rejects.toThrow(/only 2 .* available/i);
    });

    it('rejects all-or-nothing when a line needs a bulk quote instead of dropping it', async () => {
      const { service, variants, seedServiceable, seedBalance, salesOrders } = setup();
      variants.set('variant-direct', makeVariant({ id: 'variant-direct', price: 100 }));
      variants.set('variant-bulk', makeVariant({
        id: 'variant-bulk', price: 50, purchaseMode: PurchaseMode.DIRECT_AND_QUOTE, bulkQuoteThreshold: 10,
      }));
      seedServiceable('208001', 'loc-1');
      seedBalance('variant-direct', 'loc-1', 100, 0);
      seedBalance('variant-bulk', 'loc-1', 100, 0);
      await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-direct', quantity: 1 });
      await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-bulk', quantity: 15 });

      await expect(service.checkout({ guestToken: 'guest-1' }, address)).rejects.toBeInstanceOf(ConflictException);
      expect(salesOrders.size).toBe(0); // the eligible line was not silently checked out alone
    });

    it('returns the existing order on a same-key retry instead of reserving twice', async () => {
      const { service, variants, seedServiceable, seedBalance, carts, reservations } = setup();
      variants.set('variant-1', makeVariant());
      seedServiceable('208001', 'loc-1');
      seedBalance('variant-1', 'loc-1', 100, 0);
      await service.addItem({ guestToken: 'guest-1' }, { variantId: 'variant-1', quantity: 3 });

      const first = await service.checkout({ guestToken: 'guest-1' }, address);
      for (const row of carts.values()) {
        row.quotation = { reference: first.quotationReference, salesOrder: { reference: first.orderReference, grandTotal: first.grandTotal, freightTotal: 0 } };
      }

      const retry = await service.checkout({ guestToken: 'guest-1' }, address);

      expect(retry).toMatchObject({ orderReference: first.orderReference, existing: true });
      expect(reservations).toHaveLength(1); // the retry did not create a second reservation
    });

    it('rejects checking out an empty cart', async () => {
      const { service } = setup();
      await expect(service.checkout({ guestToken: 'guest-none' }, address)).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
