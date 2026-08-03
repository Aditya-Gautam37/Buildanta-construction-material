import type { Metadata } from "next";
export const metadata: Metadata = { title: "Create a Customer Account", description: "Create your Buildanta customer account for product discovery and project quote requests.", robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
