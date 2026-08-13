const defaultInventoryApiUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-api.vercel.app"

const inventoryApiUrl = (process.env.INVENTORY_API_URL || process.env.NEXT_PUBLIC_API_URL || defaultInventoryApiUrl).replace(/\/$/, "")

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; packageSlug: string }> },
) {
  const { slug, packageSlug } = await params
  if (!slug.trim() || !packageSlug.trim()) {
    return Response.json({ error: "Missing professional or package." }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Please complete the form and try again." }, { status: 400 })
  }

  try {
    const response = await fetch(
      `${inventoryApiUrl}/professionals/${encodeURIComponent(slug)}/packages/${encodeURIComponent(packageSlug)}/enquiries`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Forwarded as-is: the API validates it, and the price is recomputed
        // server-side regardless of what the browser sent.
        body: JSON.stringify(body),
        cache: "no-store",
      },
    )
    const payload = await response.json() as { message?: string; reference?: string; packageName?: string }

    if (!response.ok) {
      // The API's messages here are already written for customers.
      return Response.json(
        { error: payload.message || "We could not send that enquiry. Please try again." },
        { status: response.status },
      )
    }
    return Response.json(payload, { headers: { "cache-control": "no-store" } })
  } catch {
    return Response.json({ error: "We could not send that enquiry right now. Please try again shortly." }, { status: 503 })
  }
}
