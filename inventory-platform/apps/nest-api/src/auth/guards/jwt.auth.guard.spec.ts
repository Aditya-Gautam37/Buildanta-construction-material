import { UserRole } from "@workspace/db";
import { isInventoryStaff } from "./jwt.auth.guard";

describe("inventory roles", () => {
  it("allows all explicit staff roles and rejects customer/custom roles", () => {
    expect(isInventoryStaff(UserRole.ADMIN)).toBe(true);
    expect(isInventoryStaff(UserRole.DATA_ENTRY)).toBe(true);
    expect(isInventoryStaff(UserRole.CATALOG_MANAGER)).toBe(true);
    expect(isInventoryStaff(UserRole.SALES)).toBe(true);
    expect(isInventoryStaff(UserRole.WAREHOUSE_MANAGER)).toBe(true);
    expect(isInventoryStaff(UserRole.PROCUREMENT)).toBe(true);
    expect(isInventoryStaff(UserRole.FINANCE)).toBe(true);
    expect(isInventoryStaff(UserRole.SUPPORT)).toBe(true);
    expect(isInventoryStaff(UserRole.CUSTOMER)).toBe(false);
    expect(isInventoryStaff(UserRole.CUSTOM)).toBe(false);
  });
});
