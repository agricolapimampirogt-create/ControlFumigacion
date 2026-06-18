"use client";

import { Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStage } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { FumigationStage } from "@/types";

export default function TicketPage() {
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

  if (!stage) return <p className="text-sm font-medium">Cargando ticket...</p>;

  return (
    <section className="mx-auto grid max-w-3xl gap-4">
      <div className="no-print flex justify-end">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>
      <Card>
        <CardContent className="grid gap-5">
          <div className="border-b pb-4 text-center">
            <img src="/logo-ticket-black.png" alt="AGRICOLA PIMAMPIRO" className="mx-auto mb-3 h-20 w-auto object-contain" />
            <h1 className="text-2xl font-black">AGRICOLA PIMAMPIRO</h1>
            <p className="text-sm text-muted-foreground">Reporte administrativo de fumigación</p>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Código" value={stage.code} />
            <Info label="Fecha" value={formatDate(stage.createdAt)} />
            <Info label="Cliente" value={stage.clientName} />
            <Info label="Teléfono" value={stage.clientPhone} />
            <Info label="Cultivo" value={stage.cropName} />
            <Info label="Sitio" value={stage.siteName} />
            <Info label="Técnico" value={stage.technicianName} />
            <div><span className="font-semibold">Estado: </span><StatusBadge status={stage.status} /></div>
          </div>

          <div>
            <p className="font-semibold">Plagas</p>
            <p className="text-sm">{stage.pests.map((pest) => pest.name).join(", ")}</p>
          </div>
          <div>
            <p className="mb-2 font-semibold">Productos registrados</p>
            <table className="w-full text-left text-sm">
              <thead className="bg-emerald-50">
                <tr><th className="p-2">Producto</th><th className="p-2">Cantidad</th></tr>
              </thead>
              <tbody>
                {stage.products.map((product, index) => (
                  <tr key={`${product.productId}-${index}`} className="border-t">
                    <td className="p-2">{product.name}</td>
                    <td className="p-2">{product.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <p className="font-semibold">Observaciones</p>
            <p className="text-sm">{stage.technicalObservation}</p>
          </div>
          <div className="grid justify-items-center gap-0 border-t pt-4 text-center font-mono text-black">
            <img src="/ivan-cabrera-firma.png" alt="Firma Ivan Cabrera" className="w-64 max-w-full object-contain" />
            <p className="text-sm font-black leading-tight">Iván Cabrera</p>
            <p className="text-xs font-black uppercase leading-tight">INGENIERO AGRÓNOMO</p>
            <p className="text-xs font-black leading-tight">Registro Senescyt: 1013-2017-1835382</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <p><span className="font-semibold">{label}: </span>{value}</p>;
}
