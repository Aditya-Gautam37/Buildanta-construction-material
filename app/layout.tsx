import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { getCatalogSnapshot, rootNodes } from "./live-catalog";
import { getCustomerUser } from "./customer-auth";
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
  const [catalog, customer] = await Promise.all([getCatalogSnapshot(), getCustomerUser()]);
  const activeStages = rootNodes(catalog.stages).filter((stage) => catalog.products.some((product) => product.stages.includes(stage.name)));
  const chrome = {
    categories: rootNodes(catalog.categories).map(({ name, slug }) => ({ name, slug })),
    rooms: rootNodes(catalog.rooms).map((room) => room.name),
    stages: activeStages.map((stage) => stage.name),
    inventoryHref: process.env.NEXT_PUBLIC_INVENTORY_MANAGEMENT_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3002/dashboard" : "https://buildanta-monorepo-inventory-manage.vercel.app/dashboard"),
    customerName: customer?.firstName ?? customer?.displayName,
  };
  return <html lang="en"><body className={sora.variable}><Header {...chrome} />{children}<Footer {...chrome} /></body></html>;
}
