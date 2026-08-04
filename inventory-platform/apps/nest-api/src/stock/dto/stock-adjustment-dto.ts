import type { StockTransactionType } from '@workspace/db';

export class StockAdjustmentDTO {
  variantId!: string;
  stockDelta!: number;
  reservedDelta!: number;
  type!: StockTransactionType;
  reason!: string;
  reference?: string;
}
