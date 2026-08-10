import type { Metadata } from "next";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Buildanta order with cash on delivery.",
};

export default function CheckoutPage() {
  return <main className="checkout-page">
    <CheckoutClient />
  </main>;
}
