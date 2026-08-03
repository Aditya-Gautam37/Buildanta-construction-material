import { redirect } from "next/navigation";

export default function InventoryRedirect() {
  redirect(process.env.NEXT_PUBLIC_INVENTORY_MANAGEMENT_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3002/dashboard" : "https://buildanta-monorepo-inventory-manage.vercel.app/dashboard"));
}
