import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@workspace/db';

export function requireRole(role: UserRole, allowed: UserRole[], action: string) {
  if (!allowed.includes(role)) throw new ForbiddenException(`${action} permission is required.`);
}

// Catalogue content: products, categories, brands, product variants (name, description, images, category assignment).
// Does not gate individual fields, so price/stock fields on these same records are covered by the endpoint check, not a per-field one.
export const CATALOGUE_WRITE_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.CATALOG_MANAGER, UserRole.DATA_ENTRY];

// Stock movements: adjustments, balances, reservations, transfers, stock counts.
export const STOCK_WRITE_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER];

// Supplier relationships: supplier records, supplier/dealer product links.
export const SUPPLIER_WRITE_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.PROCUREMENT];

// Location/network configuration: warehouses, units, service areas, pincodes, carriers.
export const LOCATION_CONFIG_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER];

// Financial fields on catalogue records: price, cost, stock quantities. A catalogue-write role
// (e.g. CATALOG_MANAGER) may still edit the rest of the same record without holding this.
export const CATALOGUE_FINANCIAL_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.FINANCE];

export function requireFinancialAccess(role: UserRole, fields: unknown[], action: string) {
  if (fields.some((field) => field !== undefined) && !CATALOGUE_FINANCIAL_ROLES.includes(role)) {
    throw new ForbiddenException(`${action} permission is required to set price or stock fields.`);
  }
}

// Material knowledge (Know Your Material): drafting reuses catalogue-write
// access, but publishing — the action that makes AI-grounding content
// customer-visible — is held to the same narrower bar as other
// customer-facing publication actions.
export const MATERIAL_KNOWLEDGE_PUBLISH_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.CATALOG_MANAGER];
