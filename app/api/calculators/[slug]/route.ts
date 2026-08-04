const DEFAULT_API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-monorepo-nest-api.vercel.app";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const apiUrl = (process.env.INVENTORY_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
    const response = await fetch(`${apiUrl}/calculators/public/${encodeURIComponent(slug)}`, { headers: { accept: "application/json" }, cache: "no-store" });
    const body = await response.json().catch(() => ({ message: "Calculator service returned an invalid response." }));
    return Response.json(body, { status: response.status });
  } catch {
    return Response.json({ message: "This calculator is temporarily unavailable." }, { status: 503 });
  }
}
