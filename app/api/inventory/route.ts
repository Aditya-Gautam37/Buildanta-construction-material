export async function POST() {
  return Response.json(
    {
      error: "Stock adjustments are managed in the protected Buildanta Inventory workspace.",
      code: "STOREFRONT_INVENTORY_RETIRED",
    },
    {
      status: 410,
      headers: { "cache-control": "no-store" },
    },
  );
}
