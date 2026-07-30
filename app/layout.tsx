import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { Footer, Header } from "./site-chrome";
import "./globals.css";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Buildanta — Every Build Detail in One Place", template: "%s | Buildanta" },
  description: "Discover trusted construction materials by stage, room and category. Compare products, request bulk quotes and manage supplier inventory.",
  icons: { icon: "/logo.png" },
  openGraph: {
    title: "Buildanta — Every Build Detail in One Place",
    description: "Your all-in-one source for construction materials, product discovery and project quotes.",
    images: [{ url: "/homepage_img.png", alt: "Buildanta home renovation journey" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={sora.variable}><Header />{children}<Footer /></body></html>;
}
