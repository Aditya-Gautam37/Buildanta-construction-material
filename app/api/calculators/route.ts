const DEFAULT_API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-api.vercel.app";

const apiUrl = (process.env.INVENTORY_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

export async function GET() {
  try {
    const response = await fetch(`${apiUrl}/calculators/public`, { headers: { accept: "application/json" }, cache: "no-store" });
    const body = await response.json().catch(() => ({ message: "Calculator service returned an invalid response." }));
    return Response.json(body, { status: response.status });
  } catch {
    return Response.json({ message: "Calculators are temporarily unavailable." }, { status: 503 });
  }
}
