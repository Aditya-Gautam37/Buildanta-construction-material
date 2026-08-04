import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
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
} from '../common/request-schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import type {
  CarrierCreateDTO,
  CarrierServiceAreaCreateDTO,
  DealerCreateDTO,
  DealerProductCreateDTO,
  DealerServiceAreaCreateDTO,
  FulfilmentServiceAreaDTO,
  InventoryBalanceAdjustmentDTO,
  InventoryReservationCreateDTO,
  PincodeCoverageCreateDTO,
  ServiceAreaCreateDTO,
  StockCountCreateDTO,
  StockCountStatusDTO,
  StockTransferCreateDTO,
  StockTransferStatusDTO,
  SupplierProductCreateDTO,
  WarehouseCreateDTO,
  WarehouseLocationCreateDTO,
  UnitCreateDTO,
  UnitConversionCreateDTO,
} from './dto/inventory-location-dto';
import { InventoryLocationsService } from './inventory-locations.service';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('inventory-locations')
export class InventoryLocationsController {
  constructor(private readonly service: InventoryLocationsService) {}

  @Get('public/availability')
  availability(@Query('pincode') pincode = '', @Query('productId') productId?: string): Promise<unknown> {
    return this.service.publicAvailability(pincode.trim(), productId?.trim() || undefined);
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  overview(): Promise<unknown> {
    return this.service.overview();
  }

  @Post('units')
  @UseGuards(JwtAuthGuard)
  createUnit(@Body(new ZodValidationPipe(unitCreateSchema)) input: UnitCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createUnit(input, request.user.databaseRole);
  }

  @Post('unit-conversions')
  @UseGuards(JwtAuthGuard)
  createUnitConversion(@Body(new ZodValidationPipe(unitConversionCreateSchema)) input: UnitConversionCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createUnitConversion(input, request.user.databaseRole);
  }

  @Post('warehouses')
  @UseGuards(JwtAuthGuard)
  createWarehouse(@Body(new ZodValidationPipe(warehouseCreateSchema)) input: WarehouseCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createWarehouse(input, request.user.databaseRole);
  }

  @Post('warehouse-locations')
  @UseGuards(JwtAuthGuard)
  createWarehouseLocation(@Body(new ZodValidationPipe(warehouseLocationCreateSchema)) input: WarehouseLocationCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createWarehouseLocation(input, request.user.databaseRole);
  }

  @Post('service-areas')
  @UseGuards(JwtAuthGuard)
  createServiceArea(@Body(new ZodValidationPipe(serviceAreaCreateSchema)) input: ServiceAreaCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createServiceArea(input, request.user.databaseRole);
  }

  @Post('pincodes')
  @UseGuards(JwtAuthGuard)
  addPincodes(@Body(new ZodValidationPipe(pincodeCoverageCreateSchema)) input: PincodeCoverageCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.addPincodes(input, request.user.databaseRole);
  }

  @Post('service-area-links')
  @UseGuards(JwtAuthGuard)
  linkServiceArea(@Body(new ZodValidationPipe(fulfilmentServiceAreaSchema)) input: FulfilmentServiceAreaDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.linkServiceArea(input, request.user.databaseRole);
  }

  @Post('balances/adjustments')
  @UseGuards(JwtAuthGuard)
  adjustBalance(@Body(new ZodValidationPipe(inventoryBalanceAdjustmentSchema)) input: InventoryBalanceAdjustmentDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.adjustBalance(input, request.user.id, request.user.databaseRole);
  }

  @Post('reservations')
  @UseGuards(JwtAuthGuard)
  createReservation(@Body(new ZodValidationPipe(inventoryReservationCreateSchema)) input: InventoryReservationCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createReservation(input, request.user.id, request.user.databaseRole);
  }

  @Patch('reservations/:id/release')
  @UseGuards(JwtAuthGuard)
  releaseReservation(@Param('id') id: string, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.releaseReservation(id, request.user.id, request.user.databaseRole);
  }

  @Post('transfers')
  @UseGuards(JwtAuthGuard)
  createTransfer(@Body(new ZodValidationPipe(stockTransferCreateSchema)) input: StockTransferCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createTransfer(input, request.user.databaseRole);
  }

  @Patch('transfers/:id/status')
  @UseGuards(JwtAuthGuard)
  transitionTransfer(@Param('id') id: string, @Body(new ZodValidationPipe(stockTransferStatusSchema)) input: StockTransferStatusDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.transitionTransfer(id, input, request.user.id, request.user.databaseRole);
  }

  @Post('stock-counts')
  @UseGuards(JwtAuthGuard)
  createStockCount(@Body(new ZodValidationPipe(stockCountCreateSchema)) input: StockCountCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createStockCount(input, request.user.databaseRole);
  }

  @Patch('stock-counts/:id/status')
  @UseGuards(JwtAuthGuard)
  transitionStockCount(@Param('id') id: string, @Body(new ZodValidationPipe(stockCountStatusSchema)) input: StockCountStatusDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.transitionStockCount(id, input, request.user.id, request.user.databaseRole);
  }

  @Post('supplier-products')
  @UseGuards(JwtAuthGuard)
  createSupplierProduct(@Body(new ZodValidationPipe(supplierProductCreateSchema)) input: SupplierProductCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createSupplierProduct(input, request.user.databaseRole);
  }

  @Post('dealers')
  @UseGuards(JwtAuthGuard)
  createDealer(@Body(new ZodValidationPipe(dealerCreateSchema)) input: DealerCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createDealer(input, request.user.databaseRole);
  }

  @Post('dealer-products')
  @UseGuards(JwtAuthGuard)
  createDealerProduct(@Body(new ZodValidationPipe(dealerProductCreateSchema)) input: DealerProductCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createDealerProduct(input, request.user.databaseRole);
  }

  @Post('dealer-service-areas')
  @UseGuards(JwtAuthGuard)
  createDealerServiceArea(@Body(new ZodValidationPipe(dealerServiceAreaCreateSchema)) input: DealerServiceAreaCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createDealerServiceArea(input, request.user.databaseRole);
  }

  @Post('carriers')
  @UseGuards(JwtAuthGuard)
  createCarrier(@Body(new ZodValidationPipe(carrierCreateSchema)) input: CarrierCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createCarrier(input, request.user.databaseRole);
  }

  @Post('carrier-service-areas')
  @UseGuards(JwtAuthGuard)
  createCarrierServiceArea(@Body(new ZodValidationPipe(carrierServiceAreaCreateSchema)) input: CarrierServiceAreaCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createCarrierServiceArea(input, request.user.databaseRole);
  }
}
