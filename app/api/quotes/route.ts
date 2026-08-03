const DEFAULT_API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-monorepo-nest-api.vercel.app";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const response = await fetch(`${(process.env.INVENTORY_API_URL || DEFAULT_API_URL).replace(/\/$/, "")}/quote-requests`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({ error: "Quote service returned an invalid response." }));
    return Response.json(body, { status: response.status });
  } catch {
    return Response.json({ error: "Quote service is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
