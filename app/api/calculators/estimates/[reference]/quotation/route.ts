const DEFAULT_API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-monorepo-nest-api.vercel.app";

export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  try {
    const payload = await request.json();
    const apiUrl = (process.env.INVENTORY_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
    const response = await fetch(`${apiUrl}/calculators/public/estimates/${encodeURIComponent(reference)}/quotation`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({ message: "Quotation service returned an invalid response." }));
    return Response.json(body, { status: response.status });
  } catch {
    return Response.json({ message: "The quotation request could not be submitted. Please try again." }, { status: 503 });
  }
}
