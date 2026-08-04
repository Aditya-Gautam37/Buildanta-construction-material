import { Body, Controller, Post } from '@nestjs/common';
import type { z } from 'zod';
import { quotationPublicCreateSchema } from '../common/request-schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { QuoteRequestsService } from './quote-requests.service';

type PublicQuotationInput = z.infer<typeof quotationPublicCreateSchema>;

@Controller('quote-requests')
export class QuoteRequestsController {
  constructor(private readonly quoteRequestsService: QuoteRequestsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(quotationPublicCreateSchema)) input: PublicQuotationInput) {
    return this.quoteRequestsService.create(input);
  }
}
