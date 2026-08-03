import type { Metadata } from "next";
export const metadata: Metadata = { title: "Customer Login", description: "Sign in securely to your Buildanta customer account.", robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
