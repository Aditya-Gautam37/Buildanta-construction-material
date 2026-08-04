-- Buildanta exposes business data through the Nest API, not directly through
-- Supabase PostgREST. Explicitly remove browser roles from application tables
-- and enable RLS as defence in depth. Prisma's trusted server connection and
-- Supabase service_role remain able to perform approved backend operations.

DO $$
DECLARE
  table_name text;
  private_tables text[] := ARRAY[
    'User', 'Brand', 'Category', 'Stage', 'Room', 'Product', 'ProductImage',
    'Review', 'ProductVariant', 'StockTransaction', 'Supplier', 'Unit',
    'UnitConversion', 'Warehouse', 'WarehouseLocation', 'Dealer', 'Carrier',
    'ServiceArea', 'PincodeCoverage', 'FulfilmentLocation',
    'FulfilmentServiceArea', 'InventoryBalance', 'InventoryLedgerEntry',
    'InventoryReservation', 'StockTransfer', 'StockTransferItem', 'StockCount',
    'StockCountItem', 'SupplierProduct', 'SupplierPrice', 'SupplierLeadTime',
    'DealerProduct', 'DealerServiceArea', 'CarrierServiceArea', 'Professional',
    'HomepageSlide', 'HomepageProduct', 'QuoteRequest', 'SupplierSubmission'
  ];
BEGIN
  FOREACH table_name IN ARRAY private_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon', table_name);
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM authenticated', table_name);
    END IF;
  END LOOP;
END $$;
