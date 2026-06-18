"use client";

import { Edit, ExternalLink, Printer, ReceiptText } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getSettings, getStage } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { buildPublicUrl, buildWhatsappMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import type { FumigationStage } from "@/types";

export default function StageDetailPage() {
  const params = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [stage, setStage] = useState<FumigationStage | null>(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");

  useEffect(() => {
    async function load() {
      const item = await getStage(params.id);
      setStage(item);
      if (item) {
        const settings = await getSettings();
        setPublicUrl(buildPublicUrl(item.code, settings));
        setWhatsappUrl(buildWhatsappUrl(item.clientPhone, buildWhatsappMessage(item, settings)));
      }
    }
    load();
  }, [params.id]);

  if (!stage) return <p className="text-sm font-medium">Cargando etapa...</p>;

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-emerald-950">{stage.code}</h1>
          <p className="text-sm text-muted-foreground">{stage.clientName} · {formatDate(stage.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/etapas/${stage.id}/editar`}>
            <Button variant="outline"><Edit className="h-4 w-4" />Editar</Button>
          </Link>
          {isAdmin ? (
            <>
              <Link href={`/etapas/${stage.id}/ticket`}>
                <Button variant="secondary"><Printer className="h-4 w-4" />Imprimir</Button>
              </Link>
              <Link href={`/etapas/${stage.id}/ticket-termico`}>
                <Button variant="outline"><ReceiptText className="h-4 w-4" />Ticket</Button>
              </Link>
            </>
          ) : null}
          <a href={whatsappUrl} target="_blank">
            <Button><ExternalLink className="h-4 w-4" />WhatsApp</Button>
          </a>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader><h2 className="font-bold">Datos visibles para cliente</h2></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Info label="Cliente" value={stage.clientName} />
            <Info label="Cultivo" value={stage.cropName} />
            <Info label="Sitio" value={stage.siteName} />
            <Info label="Plagas" value={stage.pests.map((pest) => pest.name).join(", ")} />
            <Info label="Observación técnica" value={stage.technicalObservation} />
            <div><span className="font-semibold">Estado: </span><StatusBadge status={stage.status} /></div>
            <Info label="Consulta pública" value={publicUrl} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-bold">Datos internos</h2></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Info label="Teléfono" value={stage.clientPhone} />
            <Info label="Técnico" value={stage.technicianName} />
            <Info label="Notas internas" value={stage.internalNotes || "Sin notas internas"} />
            <div>
              <p className="mb-2 font-semibold">Productos registrados</p>
              <div className="grid gap-2">
                {stage.products.map((product, index) => (
                  <div key={`${product.productId}-${index}`} className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2">
                    <span>{product.name}</span>
                    <strong>x{product.quantity}</strong>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold">{label}: </span>
      <span>{value}</span>
    </p>
  );
}
