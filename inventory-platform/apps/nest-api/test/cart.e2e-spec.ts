import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/database/prisma.service';
import { createFakePrisma, makeVariant } from '../src/cart/cart.test-support';

// Exercises the real HTTP stack — guards, the Zod validation pipe, rate
// limiting, and route wiring — together, the way a live request actually
// experiences them. The one thing standing between this and a real database
// is the PrismaService override below: it is never real Prisma, so this can
// never touch production (or any real) data no matter what the test does.
describe('CartController (e2e)', () => {
  let app: INestApplication<App>;
  let fake: ReturnType<typeof createFakePrisma>;

  beforeEach(async () => {
    fake = createFakePrisma();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ client: fake.client })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects a customer-only route with no bearer token (guard wiring)', async () => {
    await request(app.getHttpServer())
      .post('/cart/merge')
      .expect(401);
  });

  it('rejects a checkout with a garbage body instead of reaching the service (validation pipe wiring)', async () => {
    const response = await request(app.getHttpServer())
      .post('/cart/checkout')
      .set('x-buildanta-guest-cart', 'e2e-guest-validation')
      .send({ not: 'a valid checkout payload' })
      .expect(400);

    expect(response.body).toMatchObject({ message: 'Request validation failed.' });
    expect(response.body.requestId).toEqual(expect.any(String)); // AllExceptionsFilter wiring
  });

  it('completes a real checkout through guards, pipe and service together, and reserves stock', async () => {
    fake.variants.set('variant-1', makeVariant({ price: 414, unit: 'bag', product: { id: 'product-1', name: 'Cement', status: 'PUBLISHED' as never, sellingPrice: 414, images: [] } }));
    fake.seedServiceable('208001', 'loc-1');
    fake.seedBalance('variant-1', 'loc-1', 500, 0);

    const server = request(app.getHttpServer());
    await server
      .post('/cart/items')
      .set('x-buildanta-guest-cart', 'e2e-guest-checkout')
      .send({ variantId: 'variant-1', quantity: 10 })
      .expect(201);

    const checkoutResponse = await server
      .post('/cart/checkout')
      .set('x-buildanta-guest-cart', 'e2e-guest-checkout')
      .send({
        name: 'Aditi', email: 'aditi@example.com', phone: '9999999999',
        addressLine1: '12 Test Road', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208001',
        deliveryMethod: 'STANDARD', idempotencyKey: 'e2e-checkout-key-1',
      })
      .expect(201);

    expect(checkoutResponse.body).toMatchObject({ existing: false, grandTotal: 4140 });
    expect(fake.balances.get('variant-1:loc-1').reservedQuantity).toBe(10); // stock actually moved
  });

  it('rate-limits repeated checkout attempts (throttle wiring)', async () => {
    const server = request(app.getHttpServer());
    const attempt = () =>
      server
        .post('/cart/checkout')
        .set('x-buildanta-guest-cart', `e2e-guest-throttle-${Math.random()}`)
        .send({}); // invalid body is fine — the throttle guard runs before the pipe

    const results: Awaited<ReturnType<typeof attempt>>[] = [];
    for (let i = 0; i < 6; i += 1) results.push(await attempt());

    expect(results.slice(0, 5).every((response) => response.status === 400)).toBe(true);
    expect(results[5]!.status).toBe(429);
    expect(results[5]!.body.message).toMatch(/too many requests/i);
  });
});
