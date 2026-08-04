import {
  aggregatePublicAvailability,
  PUBLIC_AVAILABILITY,
  publicAvailabilityForStock,
} from './public-catalogue';

describe('public catalogue availability', () => {
  it('does not promise availability for untracked stock', () => {
    expect(
      publicAvailabilityForStock({
        stockTracked: false,
        stockQuantity: 100,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      }),
    ).toBe(PUBLIC_AVAILABILITY.ENQUIRY);
  });

  it('uses available rather than physical quantity', () => {
    expect(
      publicAvailabilityForStock({
        stockTracked: true,
        stockQuantity: 10,
        reservedQuantity: 10,
        lowStockThreshold: 2,
      }),
    ).toBe(PUBLIC_AVAILABILITY.OUT_OF_STOCK);
  });

  it('aggregates variants without exposing their quantities', () => {
    expect(
      aggregatePublicAvailability([
        {
          stockTracked: true,
          stockQuantity: 4,
          reservedQuantity: 3,
          lowStockThreshold: 2,
        },
        {
          stockTracked: true,
          stockQuantity: 20,
          reservedQuantity: 1,
          lowStockThreshold: 5,
        },
      ]),
    ).toBe(PUBLIC_AVAILABILITY.IN_STOCK);
  });
});
