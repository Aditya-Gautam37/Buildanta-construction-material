import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { DatabaseModule } from './database/database.module';
import { CategoriesModule } from './categories/categories.module';
import { StagesModule } from './stages/stages.module';
import { RoomsModule } from './rooms/rooms.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { BrandsModule } from './brands/brands.module';
import { ProductVariantsModule } from './product-variants/product-variants.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { HomepageContentModule } from './homepage-content/homepage-content.module';
import { QuoteRequestsModule } from './quote-requests/quote-requests.module';
import { SupplierSubmissionsModule } from './supplier-submissions/supplier-submissions.module';
import { StockModule } from './stock/stock.module';
import { InventoryLocationsModule } from './inventory-locations/inventory-locations.module';
import { QuotationsModule } from './quotations/quotations.module';
import { FulfilmentOperationsModule } from './fulfilment-operations/fulfilment-operations.module';
import { CustomerPortalModule } from './customer-portal/customer-portal.module';
import { CalculatorsModule } from './calculators/calculators.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, AuthModule, ProductsModule, CategoriesModule, StagesModule, RoomsModule, SuppliersModule, BrandsModule, ProductVariantsModule, ProfessionalsModule, HomepageContentModule, QuoteRequestsModule, SupplierSubmissionsModule, StockModule, InventoryLocationsModule, QuotationsModule, FulfilmentOperationsModule, CustomerPortalModule, CalculatorsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
