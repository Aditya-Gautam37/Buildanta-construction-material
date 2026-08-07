import * as generated from './generated/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const { Prisma, PrismaClient, UserRole, ProfessionalType, QuoteRequestStatus, SupplierSubmissionStatus, ProductStatus, VariantStatus, StockTransactionType, FulfilmentMode, FulfilmentLocationType, InventoryReservationStatus, StockTransferStatus, StockCountStatus, InventoryLedgerType, QuotationStatus, QuotationApprovalStatus, SalesOrderStatus, PaymentStatus, PurchaseRequisitionStatus, SupplierRFQStatus, SupplierResponseStatus, PurchaseOrderStatus, PurchaseApprovalDecision, GoodsReceiptStatus, SupplierReturnStatus, PickingListStatus, DeliveryScheduleStatus, DispatchStatus, ReturnRequestStatus, ReturnInspectionDecision, ReplacementStatus, CreditNoteStatus, CalculatorType, CalculatorDefinitionStatus, CalculatorVersionStatus, CalculatorQualityTier, MaterialEstimateStatus, RoomType, ElectricalPointType, ElectricalCircuitPurpose, PlumbingSystemType, PlumbingFixtureType, TemplateStatus, PlanningCoefficientStatus, PurchaseMode, CartStatus } = generated;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const globalForPrisma = globalThis;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = globalForPrisma.prisma || new generated.PrismaClient({
  adapter,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { Prisma, PrismaClient, UserRole, ProfessionalType, QuoteRequestStatus, SupplierSubmissionStatus, ProductStatus, VariantStatus, StockTransactionType, FulfilmentMode, FulfilmentLocationType, InventoryReservationStatus, StockTransferStatus, StockCountStatus, InventoryLedgerType, QuotationStatus, QuotationApprovalStatus, SalesOrderStatus, PaymentStatus, PurchaseRequisitionStatus, SupplierRFQStatus, SupplierResponseStatus, PurchaseOrderStatus, PurchaseApprovalDecision, GoodsReceiptStatus, SupplierReturnStatus, PickingListStatus, DeliveryScheduleStatus, DispatchStatus, ReturnRequestStatus, ReturnInspectionDecision, ReplacementStatus, CreditNoteStatus, CalculatorType, CalculatorDefinitionStatus, CalculatorVersionStatus, CalculatorQualityTier, MaterialEstimateStatus, RoomType, ElectricalPointType, ElectricalCircuitPurpose, PlumbingSystemType, PlumbingFixtureType, TemplateStatus, PlanningCoefficientStatus, PurchaseMode, CartStatus };
