import { Module } from '@nestjs/common';
import { SupplierSubmissionsController } from './supplier-submissions.controller';
import { SupplierSubmissionsService } from './supplier-submissions.service';

@Module({ controllers: [SupplierSubmissionsController], providers: [SupplierSubmissionsService] })
export class SupplierSubmissionsModule {}
