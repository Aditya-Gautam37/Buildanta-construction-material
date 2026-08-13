const defaultInventoryApiUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-api.vercel.app"

const inventoryApiUrl = (process.env.INVENTORY_API_URL || process.env.NEXT_PUBLIC_API_URL || defaultInventoryApiUrl).replace(/\/$/, "")

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id.trim()) return Response.json({ error: "Missing product." }, { status: 400 })

  try {
    const response = await fetch(`${inventoryApiUrl}/products/${encodeURIComponent(id)}/material-knowledge`, { cache: "no-store" })
    if (response.status === 404) return Response.json({ error: "No verified material information is available for this product yet." }, { status: 404 })
    const payload = await response.json()
    if (!response.ok) return Response.json({ error: "Material information could not be loaded." }, { status: response.status })
    return Response.json(payload, { headers: { "cache-control": "no-store" } })
  } catch {
    return Response.json({ error: "Material information is temporarily unavailable." }, { status: 503 })
  }
}
