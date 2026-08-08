import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@workspace/ui/components/sonner";
import { prisma } from "@workspace/db";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { staffRoles } from "@/lib/staff-access";
import InventoryShell from "./inventory-shell";
import "@workspace/ui/globals.css"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventory Management | Buildanta",
  description: "Inventory dashboard for Buildanta products and suppliers.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  async function handleSignOut() {
    "use server";

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } }) : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full min-w-0 overflow-x-hidden bg-[#f4f7fa] text-slate-950">
        <InventoryShell userEmail={user?.email ?? null} role={profile?.role ?? null} canUseCalculators={Boolean(profile && staffRoles.includes(profile.role))} signOutAction={handleSignOut}>
          {children}
        </InventoryShell>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
