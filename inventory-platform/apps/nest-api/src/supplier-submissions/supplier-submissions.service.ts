import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import type { supplierSubmissionSchema } from '../common/request-schemas';
import { PrismaService } from '../database/prisma.service';

export type SupplierSubmissionInput = z.infer<typeof supplierSubmissionSchema>;

@Injectable()
export class SupplierSubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Shape and required-field validation now happen in the controller's
  // ZodValidationPipe (matching every other write endpoint in the API) —
  // by the time input reaches here it's already trustworthy.
  async create(input: SupplierSubmissionInput) {
    const { reference, email, ...rest } = input;
    await this.prisma.client.supplierSubmission.create({ data: { reference, email: email.toLowerCase(), ...rest } });
    return { reference };
  }
}
