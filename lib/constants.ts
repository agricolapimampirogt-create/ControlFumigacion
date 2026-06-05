import type { Settings, StageStatus } from "@/types";

export const appName = "AGRICOLA PIMAMPIRO";

export const defaultSettings: Settings = {
  id: "main",
  businessName: appName,
  address: "Pimampiro, Luis A Martinez y Rocafuerte.",
  phone: "0959101974",
  whatsapp: "593959101974",
  photoUrl:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80",
  publicBaseUrl:
    process.env.NEXT_PUBLIC_PUBLIC_BASE_URL || "https://agricolapimampiro.netlify.app",
};

export const statusLabels: Record<StageStatus, string> = {
  pendiente_receta: "Pendiente de receta",
  cliente_notificado: "Cliente notificado",
  atendido_local: "Atendido en local",
  venta_realizada: "Venta realizada",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

export const statusTone: Record<StageStatus, string> = {
  pendiente_receta: "bg-amber-100 text-amber-800 border-amber-200",
  cliente_notificado: "bg-sky-100 text-sky-800 border-sky-200",
  atendido_local: "bg-lime-100 text-lime-800 border-lime-200",
  venta_realizada: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cerrado: "bg-slate-100 text-slate-700 border-slate-200",
  cancelado: "bg-rose-100 text-rose-800 border-rose-200",
};

export const stageStatuses = Object.keys(statusLabels) as (keyof typeof statusLabels)[];
