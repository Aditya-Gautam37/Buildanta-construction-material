import { getDb } from "../../../db";
import { quoteRequests } from "../../../db/schema";

type QuotePayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  requirement?: unknown;
  quantity?: unknown;
  deliveryPincode?: unknown;
  requiredBy?: unknown;
  projectType?: unknown;
  notes?: unknown;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as QuotePayload;
    const name = cleanString(payload.name);
    const email = cleanString(payload.email).toLowerCase();
    const phone = cleanString(payload.phone);
    const company = cleanString(payload.company);
    const requirement = cleanString(payload.requirement);
    const deliveryPincode = cleanString(payload.deliveryPincode);
    const requiredBy = cleanString(payload.requiredBy);
    const projectType = cleanString(payload.projectType);
    const notes = cleanString(payload.notes);
    const quantity = Number(payload.quantity);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid work email." }, { status: 400 });
    }
    if (!name || !phone || !company || !requirement) {
      return Response.json({ error: "Name, phone, company and product requirement are required." }, { status: 400 });
    }
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      return Response.json({ error: "Quantity must be a whole number greater than zero." }, { status: 400 });
    }
    if (!/^\d{6}$/.test(deliveryPincode)) {
      return Response.json({ error: "Enter a valid six-digit delivery pincode." }, { status: 400 });
    }

    const reference = `BQ-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const db = getDb();
    await db.insert(quoteRequests).values({
      reference, name, email, phone, company, requirement, quantity, deliveryPincode,
      requiredBy: requiredBy || null, projectType: projectType || null, notes: notes || null, createdAt: new Date(),
    });
    return Response.json({ reference }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const databaseUnavailable = /no such table|binding `DB` is unavailable/i.test(message);
    return Response.json(
      { error: databaseUnavailable ? "Quote service is being prepared. Please try again shortly." : "We couldn’t submit your request. Please try again." },
      { status: 500 },
    );
  }
}
