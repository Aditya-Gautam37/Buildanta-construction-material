import { redirect } from "next/navigation";

export default function InventoryQuotesRedirect() {
  redirect(process.env.NEXT_PUBLIC_INVENTORY_MANAGEMENT_URL || "https://buildanta-monorepo-inventory-manage.vercel.app/dashboard");
}
