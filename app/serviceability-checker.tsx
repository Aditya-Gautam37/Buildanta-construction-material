"use client";

import { useState } from "react";

type Result = {
  pincode: string;
  serviceable: boolean;
  products: { productId: string; availabilityStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "ENQUIRY"; leadTimeLabel: string }[];
};

const labels = { IN_STOCK: "Available in your area", LOW_STOCK: "Limited availability", OUT_OF_STOCK: "Request availability", ENQUIRY: "Available on enquiry" };

export function ServiceabilityChecker({ productId }: { productId?: string }) {
  const [pincode, setPincode] = useState("");
  const [message, setMessage] = useState("Enter your delivery PIN code for location-specific availability.");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function check(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(pincode)) { setState("error"); setMessage("Enter a valid six-digit PIN code."); return; }
    setState("loading"); setMessage("Checking serviceability...");
    const params = new URLSearchParams({ pincode });
    if (productId) params.set("productId", productId);
    try {
      const response = await fetch(`/api/serviceability?${params}`, { cache: "no-store" });
      const result = await response.json() as Result & { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to check serviceability.");
      window.localStorage.setItem("buildanta-delivery-pincode", pincode);
      if (!result.serviceable) { setState("error"); setMessage("Not serviceable at this PIN code yet. You can still request a quotation for manual confirmation."); return; }
      const product = productId ? result.products.find((item) => item.productId === productId) : undefined;
      setState("success");
      setMessage(product ? `${labels[product.availabilityStatus]}. ${product.leadTimeLabel}.` : "This PIN code is serviceable. Product availability is confirmed with your quotation.");
    } catch (error) {
      setState("error"); setMessage(error instanceof Error ? error.message : "Serviceability is temporarily unavailable.");
    }
  }

  return <section className={`serviceability-checker ${state}`} aria-live="polite"><div><b>Check delivery availability</b><p>{message}</p></div><form onSubmit={check}><label className="sr-only" htmlFor={`pincode-${productId || "catalogue"}`}>Delivery PIN code</label><input id={`pincode-${productId || "catalogue"}`} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pincode} onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))} placeholder="6-digit PIN code"/><button disabled={state === "loading"}>{state === "loading" ? "Checking..." : "Check"}</button></form></section>;
}
