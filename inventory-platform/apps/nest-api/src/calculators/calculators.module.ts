import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { InventoryLocationsModule } from '../inventory-locations/inventory-locations.module';
import { QuoteRequestsModule } from '../quote-requests/quote-requests.module';
import { PlanningTemplatesModule } from '../planning-templates/planning-templates.module';
import { CalculatorsController } from './calculators.controller';
import { CalculatorsService } from './calculators.service';

@Module({
  imports: [InventoryLocationsModule, QuoteRequestsModule, PlanningTemplatesModule, ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])],
  controllers: [CalculatorsController],
  providers: [CalculatorsService],
})
export class CalculatorsModule {}
