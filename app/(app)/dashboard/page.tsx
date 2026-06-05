"use client";

import { AlertCircle, Bug, ClipboardList, Eye, Leaf, Package, Printer, ReceiptText, Search, Sprout, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listClients, listCrops, listPests, listProducts, listStages, listUsers } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { AppUser, Client, Crop, FumigationStage, Pest, Product } from "@/types";

export default function DashboardPage() {
  const [stages, setStages] = useState<FumigationStage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [pests, setPests] = useState<Pest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [stageQuery, setStageQuery] = useState("");

  useEffect(() => {
    Promise.all([listStages(), listClients(), listCrops(), listPests(), listProducts(), listUsers()]).then(
      ([stageRows, clientRows, cropRows, pestRows, productRows, userRows]) => {
        setStages(stageRows);
        setClients(clientRows);
        setCrops(cropRows);
        setPests(pestRows);
        setProducts(productRows);
        setUsers(userRows);
      },
    );
  }, []);

  const today = new Date().toDateString();
  const todayStages = stages.filter((stage) => new Date(stage.createdAt).toDateString() === today).length;
  const pending = stages.filter((stage) => stage.status === "pendiente_receta").length;
  const activeTechnicians = users.filter((user) => user.rol === "tecnico" && user.estado === "activo").length;

  const frequentPest = useMemo(() => {
    const count = new Map<string, number>();
    stages.flatMap((stage) => stage.pests).forEach((pest) => count.set(pest.name, (count.get(pest.name) || 0) + 1));
    return [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Sin datos";
  }, [stages]);

  const usedProduct = useMemo(() => {
    const count = new Map<string, number>();
    stages.flatMap((stage) => stage.products).forEach((product) => count.set(product.name, (count.get(product.name) || 0) + product.quantity));
    return [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Sin datos";
  }, [stages]);

  const recentStages = useMemo(() => {
    const term = stageQuery.trim().toLowerCase();
    return stages
      .filter((stage) => {
        if (!term) return true;
        const searchable = [
          stage.code,
          stage.clientName,
          stage.cropName,
          stage.siteName,
          stage.technicianName,
          stage.status,
          formatDate(stage.createdAt),
          ...stage.pests.map((pest) => pest.name),
          ...stage.products.map((product) => product.name),
        ].join(" ");
        return searchable.toLowerCase().includes(term);
      })
      .slice(0, 8);
  }, [stageQuery, stages]);

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-2xl font-black text-emerald-950">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen operativo de Agricola Pimampiro.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={ClipboardList} label="Registros del dia" value={todayStages} />
        <Metric icon={AlertCircle} label="Pendientes" value={pending} />
        <Metric icon={Users} label="Clientes" value={clients.length} />
        <Metric icon={Sprout} label="Cultivos" value={crops.length} />
        <Metric icon={Bug} label="Plaga frecuente" value={frequentPest} />
        <Metric icon={Package} label="Producto usado" value={usedProduct} />
        <Metric icon={Leaf} label="Tecnicos activos" value={activeTechnicians} />
        <Metric icon={Bug} label="Plagas registradas" value={pests.length + products.length} />
      </div>

      <Card>
        <CardHeader className="grid gap-3 lg:grid-cols-[1fr_360px] lg:items-center">
          <h2 className="font-bold">Ultimas etapas registradas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por codigo, cliente, cultivo, plaga, sitio..."
              value={stageQuery}
              onChange={(event) => setStageQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-3 p-3 lg:hidden">
            {recentStages.map((stage) => (
              <div key={stage.id} className="grid gap-3 rounded-md border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/etapas/${stage.id}`} className="break-words text-base font-black text-primary">
                      {stage.code}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(stage.createdAt)}</p>
                  </div>
                  <StatusBadge status={stage.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MobileInfo label="Cliente" value={stage.clientName} />
                  <MobileInfo label="Cultivo" value={stage.cropName} />
                  <MobileInfo label="Sitio" value={stage.siteName} />
                  <MobileInfo label="Plagas" value={stage.pests.map((pest) => pest.name).join(", ") || "Sin plagas"} />
                </div>

                <StageActions stageId={stage.id} />
              </div>
            ))}
            {!recentStages.length ? (
              <p className="rounded-md border bg-white px-4 py-6 text-center text-sm text-muted-foreground">
                No se encontraron etapas con esa busqueda.
              </p>
            ) : null}
          </div>

          <div className="hidden overflow-x-auto lg:block">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-emerald-50 text-xs uppercase text-emerald-900">
              <tr>
                <th className="w-[13%] px-3 py-3">Codigo</th>
                <th className="w-[15%] px-3 py-3">Cliente</th>
                <th className="w-[14%] px-3 py-3">Cultivo</th>
                <th className="w-[16%] px-3 py-3">Plagas</th>
                <th className="w-[12%] px-3 py-3">Sitio</th>
                <th className="w-[13%] px-3 py-3">Estado</th>
                <th className="w-[9%] px-3 py-3 text-right">Fecha</th>
                <th className="w-[8%] bg-emerald-50 px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recentStages.map((stage) => (
                <tr key={stage.id} className="border-t transition hover:bg-emerald-50">
                  <td className="break-words px-3 py-3 font-bold text-primary">
                    <Link href={`/etapas/${stage.id}`}>{stage.code}</Link>
                  </td>
                  <td className="break-words px-3 py-3">{stage.clientName}</td>
                  <td className="break-words px-3 py-3">{stage.cropName}</td>
                  <td className="break-words px-3 py-3">{stage.pests.map((pest) => pest.name).join(", ") || "Sin plagas"}</td>
                  <td className="break-words px-3 py-3">{stage.siteName}</td>
                  <td className="px-3 py-3"><StatusBadge status={stage.status} /></td>
                  <td className="px-3 py-3 text-right text-xs text-muted-foreground">{formatDate(stage.createdAt)}</td>
                  <td className="bg-white px-3 py-3">
                    <StageActions stageId={stage.id} align="end" />
                  </td>
                </tr>
              ))}
              {!recentStages.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No se encontraron etapas con esa busqueda.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function StageActions({ stageId, align = "start" }: { stageId: string; align?: "start" | "end" }) {
  const mobileGrid = align === "start" ? "grid grid-cols-3" : "flex flex-wrap";
  return (
    <div className={`${mobileGrid} gap-2 ${align === "end" ? "justify-end" : "justify-start"}`}>
      <Link href={`/etapas/${stageId}`}>
        <Button className="w-full px-2" variant="outline" size="sm" aria-label="Ver etapa" title="Ver">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver</span>
        </Button>
      </Link>
      <Link href={`/etapas/${stageId}/ticket`}>
        <Button className="w-full px-2" variant="secondary" size="sm" aria-label="Imprimir reporte" title="Imprimir">
          <Printer className="h-4 w-4" />
          <span className="sr-only">Imprimir</span>
        </Button>
      </Link>
      <Link href={`/etapas/${stageId}/ticket-termico`}>
        <Button className="w-full px-2" variant="outline" size="sm" aria-label="Ticket termico" title="Ticket">
          <ReceiptText className="h-4 w-4" />
          <span className="sr-only">Ticket</span>
        </Button>
      </Link>
    </div>
  );
}

function MobileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="break-words font-medium text-emerald-950">{value}</p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-black text-emerald-950">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
