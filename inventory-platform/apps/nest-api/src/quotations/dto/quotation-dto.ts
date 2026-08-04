import type { z } from 'zod';
import {
  quotationAcceptSchema,
  quotationApprovalDecisionSchema,
  quotationRevisionCreateSchema,
  quotationStatusUpdateSchema,
  salesOrderCancelSchema,
} from '../../common/request-schemas';

export type QuotationRevisionCreateDTO = z.infer<typeof quotationRevisionCreateSchema>;
export type QuotationStatusUpdateDTO = z.infer<typeof quotationStatusUpdateSchema>;
export type QuotationApprovalDecisionDTO = z.infer<typeof quotationApprovalDecisionSchema>;
export type QuotationAcceptDTO = z.infer<typeof quotationAcceptSchema>;
export type SalesOrderCancelDTO = z.infer<typeof salesOrderCancelSchema>;
