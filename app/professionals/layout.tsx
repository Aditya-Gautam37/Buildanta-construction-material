import type { Metadata } from "next";
import { SERVICE_AREA, SERVICE_CITY } from "./location";

const title = `Construction Professionals in ${SERVICE_CITY} | Buildanta`;
const description = `Discover contractors, architects, interior designers and building professionals serving ${SERVICE_AREA}.`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { title, description },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
