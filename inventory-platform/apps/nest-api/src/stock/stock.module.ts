import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { InventoryLocationsModule } from '../inventory-locations/inventory-locations.module';

@Module({
  imports: [DatabaseModule, InventoryLocationsModule],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}
