"use client";

import { ExternalLink, MapPin, MessageCircle, Search } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CompanyLogo } from "@/components/company-logo";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPublicStageByCode, getSettings } from "@/lib/data";
import { defaultSettings } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import type { PublicStage, Settings } from "@/types";

const publicHeroPhoto = "/agricola-public-hero.webp";
const publicLocalPhoto = "/agricola-public-local.webp";

export default function PublicConsultationPage() {
  const params = useParams<{ codigo: string }>();
  const [code, setCode] = useState(params.codigo || "");
  const [stage, setStage] = useState<PublicStage | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [notFound, setNotFound] = useState(false);

  async function search(value = code) {
    const [item, config] = await Promise.all([getPublicStageByCode(value.trim().toUpperCase()), getSettings()]);
    setSettings(config);
    setStage(item);
    setNotFound(!item);
  }

  useEffect(() => {
    search(params.codigo);
  }, [params.codigo]);

  const whatsapp = buildWhatsappUrl(settings.whatsapp || settings.phone, `Hola, necesito información sobre mi registro ${stage?.code || code}`);
  const companyWhatsapp = buildWhatsappUrl(settings.whatsapp || settings.phone, "Hola, necesito información sobre AGRICOLA PIMAMPIRO.");
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`;

  return (
    <main className="min-h-screen">
      <section className="relative min-h-[320px] overflow-hidden bg-emerald-900 text-white">
        <img src={publicHeroPhoto} alt="Agrícola Pimampiro" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="relative mx-auto flex max-w-5xl flex-col justify-end px-4 py-10 sm:min-h-[360px]">
          <CompanyLogo className="mb-5" imageClassName="h-24 rounded-md bg-white/95 p-2 shadow-sm" />
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-100">Consulta pública</p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">AGRICOLA PIMAMPIRO</h1>
          <p className="mt-3 max-w-2xl text-emerald-50">Seguimiento de registro técnico de fumigación agrícola.</p>
        </div>
      </section>

      <section className="mx-auto -mt-12 grid max-w-5xl gap-5 px-4 pb-10">
        <Card className="relative">
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="AP-2026-5K82Q" />
              <Button onClick={() => search()}>
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {notFound ? (
          <Card><CardContent><p className="text-sm font-medium">No se encontró un registro público con ese código.</p></CardContent></Card>
        ) : null}

        {stage ? (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <Card>
              <CardContent className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">Código</p>
                    <h2 className="text-3xl font-black text-primary">{stage.code}</h2>
                  </div>
                  <StatusBadge status={stage.status} />
                </div>
                <Info label="Fecha" value={formatDate(stage.createdAt)} />
                <Info label="Cliente" value={stage.clientName} />
                <Info label="Cultivo" value={stage.cropName} />
                <Info label="Sitio" value={stage.siteName} />
                <Info label="Plagas detectadas" value={stage.pests.map((pest) => pest.name).join(", ")} />
                <Info label="Observación técnica" value={stage.technicalObservation} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid gap-4">
                <img src={publicLocalPhoto} alt="Local Agrícola Pimampiro" className="h-44 w-full rounded-md object-cover" />
                <Info label="Dirección" value={settings.address} />
                <Info label="Contacto" value={settings.phone} />
                <div className="grid gap-2">
                  <a href={whatsapp} target="_blank">
                    <Button className="w-full"><MessageCircle className="h-4 w-4" />WhatsApp</Button>
                  </a>
                  <a href={maps} target="_blank">
                    <Button variant="secondary" className="w-full"><MapPin className="h-4 w-4" />Cómo llegar</Button>
                  </a>
                  <a href={companyWhatsapp} target="_blank" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary">
                    <ExternalLink className="h-4 w-4" />
                    Contactar local
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <p className="text-sm"><span className="font-bold text-emerald-950">{label}: </span>{value}</p>;
}
