const defaultInventoryApiUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-api.vercel.app"

const inventoryApiUrl = (process.env.INVENTORY_API_URL || process.env.NEXT_PUBLIC_API_URL || defaultInventoryApiUrl).replace(/\/$/, "")

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id.trim()) return Response.json({ error: "Missing product." }, { status: 400 })

  let question = ""
  try {
    const body = await request.json() as { question?: unknown }
    question = typeof body.question === "string" ? body.question.trim() : ""
  } catch {
    return Response.json({ error: "Enter a question." }, { status: 400 })
  }
  if (!question) return Response.json({ error: "Enter a question." }, { status: 400 })
  if (question.length > 500) return Response.json({ error: "Please shorten your question." }, { status: 400 })

  try {
    const response = await fetch(`${inventoryApiUrl}/products/${encodeURIComponent(id)}/material-knowledge/ask`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
      cache: "no-store",
    })
    const payload = await response.json() as { answer?: string; message?: string }
    if (!response.ok) {
      // The API's messages here are already customer-safe and specific
      // (rate limited, unavailable, unpublished), so pass them through.
      return Response.json({ error: payload.message || "The assistant is unavailable right now." }, { status: response.status })
    }
    return Response.json({ answer: payload.answer }, { headers: { "cache-control": "no-store" } })
  } catch {
    return Response.json({ error: "The assistant is unavailable right now." }, { status: 503 })
  }
}
