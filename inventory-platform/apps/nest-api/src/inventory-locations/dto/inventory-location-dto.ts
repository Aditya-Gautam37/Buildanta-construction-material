import { z } from 'zod';
import {
  carrierCreateSchema,
  carrierServiceAreaCreateSchema,
  dealerCreateSchema,
  dealerProductCreateSchema,
  dealerServiceAreaCreateSchema,
  fulfilmentServiceAreaSchema,
  inventoryBalanceAdjustmentSchema,
  inventoryReservationCreateSchema,
  pincodeCoverageCreateSchema,
  serviceAreaCreateSchema,
  stockCountCreateSchema,
  stockCountStatusSchema,
  stockTransferCreateSchema,
  stockTransferStatusSchema,
  supplierProductCreateSchema,
  warehouseCreateSchema,
  warehouseLocationCreateSchema,
  unitCreateSchema,
  unitConversionCreateSchema,
} from '../../common/request-schemas';

export type WarehouseCreateDTO = z.infer<typeof warehouseCreateSchema>;
export type WarehouseLocationCreateDTO = z.infer<typeof warehouseLocationCreateSchema>;
export type ServiceAreaCreateDTO = z.infer<typeof serviceAreaCreateSchema>;
export type PincodeCoverageCreateDTO = z.infer<typeof pincodeCoverageCreateSchema>;
export type FulfilmentServiceAreaDTO = z.infer<typeof fulfilmentServiceAreaSchema>;
export type InventoryBalanceAdjustmentDTO = z.infer<typeof inventoryBalanceAdjustmentSchema>;
export type InventoryReservationCreateDTO = z.infer<typeof inventoryReservationCreateSchema>;
export type StockTransferCreateDTO = z.infer<typeof stockTransferCreateSchema>;
export type StockTransferStatusDTO = z.infer<typeof stockTransferStatusSchema>;
export type StockCountCreateDTO = z.infer<typeof stockCountCreateSchema>;
export type StockCountStatusDTO = z.infer<typeof stockCountStatusSchema>;
export type SupplierProductCreateDTO = z.infer<typeof supplierProductCreateSchema>;
export type DealerCreateDTO = z.infer<typeof dealerCreateSchema>;
export type DealerProductCreateDTO = z.infer<typeof dealerProductCreateSchema>;
export type DealerServiceAreaCreateDTO = z.infer<typeof dealerServiceAreaCreateSchema>;
export type CarrierCreateDTO = z.infer<typeof carrierCreateSchema>;
export type CarrierServiceAreaCreateDTO = z.infer<typeof carrierServiceAreaCreateSchema>;
export type UnitCreateDTO = z.infer<typeof unitCreateSchema>;
export type UnitConversionCreateDTO = z.infer<typeof unitConversionCreateSchema>;
