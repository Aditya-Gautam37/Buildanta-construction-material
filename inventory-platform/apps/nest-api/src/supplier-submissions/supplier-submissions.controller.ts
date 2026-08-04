import { Body, Controller, Post } from '@nestjs/common';
import { SupplierSubmissionsService, type SupplierSubmissionInput } from './supplier-submissions.service';

@Controller('supplier-submissions')
export class SupplierSubmissionsController {
  constructor(private readonly supplierSubmissionsService: SupplierSubmissionsService) {}

  @Post()
  create(@Body() input: SupplierSubmissionInput) {
    return this.supplierSubmissionsService.create(input);
  }
}
