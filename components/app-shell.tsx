"use client";

import {
  Bell,
  BarChart3,
  Bug,
  ClipboardList,
  Home,
  LogOut,
  MapPin,
  Menu,
  Package,
  Sprout,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { CompanyLogo } from "@/components/company-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home, roles: ["admin", "tecnico"] },
  { href: "/etapas", label: "Etapas", icon: ClipboardList, roles: ["admin", "tecnico"] },
  { href: "/clientes", label: "Clientes", icon: Users, roles: ["admin", "tecnico"] },
  { href: "/cultivos", label: "Cultivos", icon: Sprout, roles: ["admin"] },
  { href: "/plagas", label: "Plagas", icon: Bug, roles: ["admin"] },
  { href: "/productos", label: "Productos", icon: Package, roles: ["admin"] },
  { href: "/sitios", label: "Sitios", icon: MapPin, roles: ["admin"] },
  { href: "/usuarios", label: "Usuarios", icon: Users, roles: ["admin"] },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell, roles: ["admin"] },
  { href: "/reportes", label: "Reportes", icon: BarChart3, roles: ["admin"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState("");
  const items = nav.filter((item) => item.roles.includes(user?.rol || "tecnico"));

  function prefetchRoute(href: string) {
    router.prefetch(href);
  }

  function startNavigation(href: string) {
    prefetchRoute(href);
    if (href !== pathname && !pathname.startsWith(`${href}/`)) setNavigatingTo(href);
  }

  async function handleLogout() {
    setOpen(false);
    await logout();
  }

  useEffect(() => {
    setNavigatingTo("");
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    const timeout = window.setTimeout(() => {
      nav
        .filter((item) => item.roles.includes(user.rol))
        .forEach((item) => prefetchRoute(item.href));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [router, user]);

  const menu = (
    <nav className="grid gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={() => startNavigation(item.href)}
            onFocus={() => prefetchRoute(item.href)}
            onMouseEnter={() => prefetchRoute(item.href)}
            onTouchStart={() => prefetchRoute(item.href)}
            className={cn(
              "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
              active ? "bg-primary text-white" : "text-emerald-950 hover:bg-emerald-50",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {navigatingTo ? (
        <div className="pointer-events-none fixed left-0 top-0 z-[70] h-1 w-full overflow-hidden bg-emerald-100">
          <div className="h-full w-2/3 animate-pulse bg-primary" />
        </div>
      ) : null}
      <aside className="no-print fixed left-0 top-0 z-30 hidden h-screen w-72 border-r bg-white/95 p-4 backdrop-blur lg:block">
        <div className="mb-6">
          <CompanyLogo imageClassName="h-20 max-w-[220px]" />
        </div>
        {menu}
        <div className="absolute bottom-4 left-4 right-4 rounded-md border bg-emerald-50 p-3">
          <p className="text-sm font-semibold">{user?.nombre}</p>
          <p className="text-xs capitalize text-muted-foreground">{user?.rol}</p>
          <Button variant="ghost" className="mt-3 w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>
      </aside>

      <header className="no-print sticky top-0 z-20 border-b bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <CompanyLogo compact imageClassName="h-10 max-w-[190px]" />
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {open ? (
        <div className="no-print fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-80 max-w-[88vw] bg-white p-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <span className="font-black text-primary">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            {menu}
            <div className="mt-5 rounded-md border bg-emerald-50 p-3">
              <p className="text-sm font-semibold">{user?.nombre}</p>
              <p className="text-xs capitalize text-muted-foreground">{user?.rol}</p>
              <Button variant="danger" className="mt-3 h-12 w-full justify-center" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Cerrar sesion
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="app-shell-main px-3 py-4 pb-24 sm:px-4 sm:py-5 lg:ml-72 lg:px-8 lg:py-7">{children}</main>

      <nav className="no-print fixed bottom-0 left-0 right-0 z-20 grid grid-cols-4 border-t bg-white p-2 lg:hidden">
        {items.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onClick={() => startNavigation(item.href)}
              onFocus={() => prefetchRoute(item.href)}
              onMouseEnter={() => prefetchRoute(item.href)}
              onTouchStart={() => prefetchRoute(item.href)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-semibold",
                active ? "bg-primary text-white" : "text-emerald-950",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
