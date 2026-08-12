import { Body, Controller, Post } from '@nestjs/common';
import type { z } from 'zod';
import { supplierSubmissionSchema } from '../common/request-schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { SupplierSubmissionsService } from './supplier-submissions.service';

@Controller('supplier-submissions')
export class SupplierSubmissionsController {
  constructor(private readonly supplierSubmissionsService: SupplierSubmissionsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(supplierSubmissionSchema)) input: z.infer<typeof supplierSubmissionSchema>) {
    return this.supplierSubmissionsService.create(input);
  }
}
