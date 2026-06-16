"use client";

import { Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { getStage } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { FumigationStage } from "@/types";

export default function ThermalTicketPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [stage, setStage] = useState<FumigationStage | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    async function load() {
      const item = await getStage(params.id);
      setStage(item);
    }
    load();
  }, [isAdmin, params.id, router]);

  function printTicket() {
    const previousTitle = document.title;
    document.title = "";
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.print();
    window.setTimeout(restoreTitle, 1000);
  }

  if (!stage) return <p className="text-sm font-medium">Cargando ticket...</p>;

  return (
    <section className="thermal-page-shell mx-auto grid gap-4">
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0 !important;
          }

          html,
          body {
            width: 80mm;
            min-width: 80mm;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .thermal-page-shell {
            display: block !important;
            width: 80mm !important;
            max-width: 80mm !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .thermal-ticket {
            width: 80mm !important;
            max-width: 80mm !important;
            height: auto !important;
            min-height: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 2mm 4mm 0 !important;
            border-radius: 0 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          .thermal-ticket footer {
            padding-bottom: 0 !important;
            margin-bottom: 0 !important;
          }
        }
      `}</style>

      <div className="no-print flex justify-end">
        <Button onClick={printTicket}>
          <Printer className="h-4 w-4" />
          Imprimir ticket
        </Button>
      </div>

      <article className="thermal-ticket w-[80mm] max-w-full rounded-md border bg-white p-4 font-mono text-[12px] leading-snug text-black shadow-sm">
        <header className="border-b border-dashed border-black pb-3 text-center">
          <img src="/logo-ticket-black.png" alt="AGRICOLA PIMAMPIRO" className="mx-auto mb-2 h-12 w-auto object-contain" />
          <h1 className="text-base font-black">AGRICOLA PIMAMPIRO</h1>
          <p className="mt-1 text-[11px] uppercase">Ticket de consulta</p>
        </header>

        <div className="grid gap-2 border-b border-dashed border-black py-3">
          <Info label="Codigo" value={stage.code} />
          <Info label="Fecha" value={formatDate(stage.createdAt)} />
          <Info label="Cliente" value={stage.clientName} />
          <Info label="Cultivo" value={stage.cropName} />
          <Info label="Sitio" value={stage.siteName} />
          <Info label="Estado" value={statusLabels[stage.status]} />
        </div>

        <div className="grid gap-2 border-b border-dashed border-black py-3">
          <Info label="Plagas" value={stage.pests.map((pest) => pest.name).join(", ")} />
          <div>
            <p className="font-bold">Productos:</p>
            <div className="mt-1 grid gap-1">
              {stage.products.length > 0 ? (
                stage.products.map((product, index) => (
                  <p key={`${product.productId}-${index}`} className="flex justify-between gap-3">
                    <span>{product.name}</span>
                    <span className="shrink-0 font-bold">{product.quantity}</span>
                  </p>
                ))
              ) : (
                <p>Sin productos registrados</p>
              )}
            </div>
          </div>
          <Info label="Observaciones" value={stage.technicalObservation} />
        </div>

        <footer className="grid justify-items-center gap-0 pt-2 text-center font-mono text-black">
          <img src="/ivan-cabrera-firma.png" alt="Firma Ivan Cabrera" className="w-[58mm] max-w-full object-contain" />
          <p className="text-[13px] font-black leading-tight">Iván Cabrera</p>
          <p className="text-[12px] font-black uppercase leading-tight">INGENIERO AGRÓNOMO</p>
          <p className="text-[12px] font-black leading-tight">Registro Senescyt: 1013-2017-1835382</p>
        </footer>
      </article>
    </section>
  );
}

const statusLabels: Record<FumigationStage["status"], string> = {
  pendiente_receta: "Pendiente de receta",
  cliente_notificado: "Cliente notificado",
  atendido_local: "Atendido en local",
  venta_realizada: "Venta realizada",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-bold">{label}: </span>
      <span>{value}</span>
    </p>
  );
}
