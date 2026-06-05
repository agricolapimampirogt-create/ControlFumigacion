"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

const adminOnly = ["/usuarios", "/reportes", "/notificaciones"];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.rol !== "admin" && adminOnly.some((route) => pathname.startsWith(route))) {
      router.replace("/dashboard");
    }
  }, [loading, pathname, router, user]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-medium">Cargando sistema...</div>;
  }

  if (!user) return null;

  return children;
}
