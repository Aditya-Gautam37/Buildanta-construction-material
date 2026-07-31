import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { getCatalogSnapshot, rootNodes } from "./live-catalog";
import { Footer, Header } from "./site-chrome";
import "./globals.css";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Buildanta — Every Build Detail in One Place", template: "%s | Buildanta" },
  description: "Discover trusted construction materials by stage, room and category. Compare products and request project quotes.",
  icons: { icon: "/logo.png" },
  openGraph: {
    title: "Buildanta — Every Build Detail in One Place",
    description: "Your all-in-one source for construction materials, product discovery and project quotes.",
    images: [{ url: "/og.png", alt: "Buildanta construction-material marketplace" }],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getCatalogSnapshot();
  const chrome = {
    categories: rootNodes(catalog.categories).map(({ name, slug }) => ({ name, slug })),
    rooms: rootNodes(catalog.rooms).map((room) => room.name),
    stages: rootNodes(catalog.stages).map((stage) => stage.name),
    inventoryHref: process.env.NEXT_PUBLIC_INVENTORY_MANAGEMENT_URL || "https://buildanta-monorepo-inventory-manage.vercel.app/dashboard",
  };
  return <html lang="en"><body className={sora.variable}><Header {...chrome} />{children}<Footer {...chrome} /></body></html>;
}
