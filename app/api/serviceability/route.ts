const inventoryApiUrl = (process.env.INVENTORY_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5173").replace(/\/$/, "")

export async function GET(request: Request) {
  const url = new URL(request.url)
  const pincode = url.searchParams.get("pincode")?.trim() || ""
  const productId = url.searchParams.get("productId")?.trim() || ""
  if (!/^\d{6}$/.test(pincode)) return Response.json({ error: "Enter a valid six-digit PIN code." }, { status: 400 })
  const params = new URLSearchParams({ pincode })
  if (productId) params.set("productId", productId)
  try {
    const response = await fetch(`${inventoryApiUrl}/inventory-locations/public/availability?${params}`, { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok) return Response.json({ error: "Serviceability could not be checked." }, { status: response.status })
    return Response.json(payload, { headers: { "cache-control": "no-store" } })
  } catch {
    return Response.json({ error: "Serviceability is temporarily unavailable. Please request confirmation." }, { status: 503 })
  }
}
