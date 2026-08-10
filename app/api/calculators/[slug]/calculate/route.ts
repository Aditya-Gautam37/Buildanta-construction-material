const DEFAULT_API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-api.vercel.app";

async function calculateWithRetry(url: string, payload: unknown) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw lastError;
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const payload = await request.json();
    const apiUrl = (process.env.INVENTORY_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
    const response = await calculateWithRetry(`${apiUrl}/calculators/public/${encodeURIComponent(slug)}/calculate`, payload);
    if (response.status === 429) return Response.json({ message: "Too many calculation attempts. Please wait one minute and try again." }, { status: 429 });
    const body = await response.json().catch(() => ({ message: "Calculator service returned an invalid response." }));
    return Response.json(body, { status: response.status });
  } catch (error) {
    console.error("Calculator API request failed", error);
    return Response.json({ message: "The calculation service is temporarily unavailable. Please try again in a moment." }, { status: 503 });
  }
}
