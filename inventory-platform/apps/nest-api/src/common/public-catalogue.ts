export const PUBLIC_AVAILABILITY = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  ENQUIRY: 'ENQUIRY',
} as const;

export type PublicAvailability =
  (typeof PUBLIC_AVAILABILITY)[keyof typeof PUBLIC_AVAILABILITY];

export type StockSummary = {
  stockTracked: boolean;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
};

export type LocationBalanceSummary = {
  physicalQuantity: number;
  reservedQuantity: number;
  blockedQuantity: number;
  damagedQuantity: number;
  quarantineQuantity: number;
  lowStockThreshold: number;
};

export function publicAvailabilityForStock(
  stock: StockSummary,
): PublicAvailability {
  if (!stock.stockTracked) {
    return PUBLIC_AVAILABILITY.ENQUIRY;
  }

  const available = stock.stockQuantity - stock.reservedQuantity;
  if (available <= 0) {
    return PUBLIC_AVAILABILITY.OUT_OF_STOCK;
  }

  if (available <= stock.lowStockThreshold) {
    return PUBLIC_AVAILABILITY.LOW_STOCK;
  }

  return PUBLIC_AVAILABILITY.IN_STOCK;
}

export function aggregatePublicAvailability(
  variants: StockSummary[],
): PublicAvailability {
  const statuses = variants.map(publicAvailabilityForStock);

  if (statuses.includes(PUBLIC_AVAILABILITY.IN_STOCK)) {
    return PUBLIC_AVAILABILITY.IN_STOCK;
  }
  if (statuses.includes(PUBLIC_AVAILABILITY.LOW_STOCK)) {
    return PUBLIC_AVAILABILITY.LOW_STOCK;
  }
  if (statuses.includes(PUBLIC_AVAILABILITY.OUT_OF_STOCK)) {
    return PUBLIC_AVAILABILITY.OUT_OF_STOCK;
  }
  return PUBLIC_AVAILABILITY.ENQUIRY;
}

export function publicAvailabilityForBalances(
  balances: LocationBalanceSummary[],
): PublicAvailability {
  if (balances.length === 0) return PUBLIC_AVAILABILITY.ENQUIRY;
  const available = balances.reduce(
    (sum, balance) =>
      sum +
      Math.max(
        0,
        balance.physicalQuantity -
          balance.reservedQuantity -
          balance.blockedQuantity -
          balance.damagedQuantity -
          balance.quarantineQuantity,
      ),
    0,
  );
  const threshold = balances.reduce(
    (sum, balance) => sum + balance.lowStockThreshold,
    0,
  );
  if (available <= 0) return PUBLIC_AVAILABILITY.OUT_OF_STOCK;
  if (available <= threshold) return PUBLIC_AVAILABILITY.LOW_STOCK;
  return PUBLIC_AVAILABILITY.IN_STOCK;
}

export function aggregatePublicAvailabilityStatuses(
  statuses: PublicAvailability[],
): PublicAvailability {
  if (statuses.includes(PUBLIC_AVAILABILITY.IN_STOCK)) return PUBLIC_AVAILABILITY.IN_STOCK;
  if (statuses.includes(PUBLIC_AVAILABILITY.LOW_STOCK)) return PUBLIC_AVAILABILITY.LOW_STOCK;
  if (statuses.includes(PUBLIC_AVAILABILITY.OUT_OF_STOCK)) return PUBLIC_AVAILABILITY.OUT_OF_STOCK;
  return PUBLIC_AVAILABILITY.ENQUIRY;
}
