"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  ChevronRight,
  ClipboardList,
  FolderTree,
  GalleryHorizontalEnd,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  PackageCheck,
  ShoppingCart,
  Truck,
  UserRound,
  X,
} from "lucide-react"

type NavigationItem = { label: string; href: string; icon: typeof LayoutDashboard }

const navigationGroups: Array<{ label: string; items: NavigationItem[] }> = [
  { label: "Workspace", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    label: "Catalogue",
    items: [
      { label: "Products", href: "/catalog-control", icon: PackageCheck },
      { label: "Direct purchase", href: "/commerce", icon: ShoppingCart },
      { label: "Product Categories", href: "/category-management", icon: FolderTree },
      { label: "Homepage", href: "/homepage-content", icon: GalleryHorizontalEnd },
      { label: "Professionals", href: "/professionals", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Customer orders", href: "/orders", icon: ClipboardList },
      { label: "Stock & locations", href: "/inventory-locations", icon: MapPinned },
      { label: "Quotations", href: "/quotations", icon: Inbox },
      { label: "Fulfilment", href: "/fulfilment", icon: Truck },
      { label: "Calculators", href: "/calculators", icon: Calculator },
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
]

const pageTitles: Record<string, string> = {
  "/dashboard": "Operations overview",
  "/catalog-control": "Product catalogue",
  "/commerce": "Direct purchase settings",
  "/category-management": "Product categories",
  "/homepage-content": "Storefront homepage",
  "/professionals": "Professional directory",
  "/inventory-locations": "Stock and locations",
  "/quotations": "Quotations",
  "/fulfilment": "Purchasing and fulfilment",
  "/calculators": "Material calculators",
  "/reports": "Reports",
  "/profile/complete": "Your profile",
}

export default function InventoryShell({
  children,
  userEmail,
  role,
  canUseCalculators,
  signOutAction,
}: {
  children: ReactNode
  userEmail: string | null
  role: string | null
  canUseCalculators: boolean
  signOutAction: () => Promise<void>
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const groups = navigationGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.href !== "/calculators" || canUseCalculators),
  }))
  const title = Object.entries(pageTitles).find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1] ?? "Inventory management"

  const navigation = <>
    {groups.map((group) => <section key={group.label} className="space-y-1">
      <p className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 first:pt-0">{group.label}</p>
      {group.items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? "bg-[#123a5e] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
          <Icon className={`size-[18px] ${active ? "text-emerald-300" : "text-slate-400 group-hover:text-emerald-700"}`} />
          <span className="flex-1">{item.label}</span>
          {active && <ChevronRight className="size-4 text-slate-400" />}
        </Link>
      })}
    </section>)}
  </>

  return <div className="min-h-screen bg-[#eef4fb]">
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <Link href="/dashboard" className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-5">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#123a5e] text-lg font-black text-white shadow-lg shadow-slate-900/10">B</span>
        <span><strong className="block text-base tracking-tight text-slate-950">Buildanta</strong><small className="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Inventory operations</small></span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-5">{navigation}</nav>
      <Link href="/profile/complete" className="m-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-emerald-300 hover:bg-emerald-50">
        <span className="grid size-9 place-items-center rounded-xl bg-white text-slate-600 shadow-sm"><UserRound className="size-4" /></span>
        <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-900">{userEmail ?? "Inventory user"}</strong><small className="block truncate text-[10px] font-semibold capitalize text-slate-500">{role?.replaceAll("_", " ").toLowerCase() ?? "Profile"}</small></span>
      </Link>
    </aside>

    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-white shadow-2xl"><div className="flex h-16 items-center justify-between border-b border-slate-100 px-4"><strong>Buildanta Inventory</strong><button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="grid size-10 place-items-center rounded-xl bg-slate-100"><X className="size-5" /></button></div><nav className="flex-1 overflow-y-auto px-3 py-4">{navigation}</nav></aside></div>}

    <div className="min-w-0 lg:pl-64">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-[#f7fbff]/70 px-4 backdrop-blur-xl backdrop-saturate-150 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3"><button aria-label="Open navigation" className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></button><div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Buildanta operations</p><h1 className="truncate text-base font-bold tracking-tight text-slate-950 sm:text-lg">{title}</h1></div></div>
        <div className="flex items-center gap-2"><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 sm:inline-flex"><i className="mr-2 mt-1 size-1.5 rounded-full bg-emerald-500" />API connected</span>{userEmail ? <form action={signOutAction}><button type="submit" className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl bg-slate-950 px-3.5 text-xs font-bold text-white transition hover:bg-[#123a5e]"><LogOut className="size-4" /><span className="hidden sm:inline">Log out</span></button></form> : <Link href="/login" className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white">Login</Link>}</div>
      </header>
      {children}
    </div>
  </div>
}
