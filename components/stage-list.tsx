"use client";

import { Eye, Plus, Printer, ReceiptText, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { listStages } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { FumigationStage } from "@/types";

export function StageList() {
  const { user, isAdmin } = useAuth();
  const [rows, setRows] = useState<FumigationStage[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    listStages(user).then(setRows);
  }, [user]);

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return rows.filter((stage) => {
      const matchesQuery = JSON.stringify(stage).toLowerCase().includes(term);
      const matchesStatus = status ? stage.status === status : true;
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, status]);

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-emerald-950">Etapas de fumigación</h1>
          <p className="text-sm text-muted-foreground">Seguimiento técnico por cliente, cultivo, técnico y código.</p>
        </div>
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-base font-medium text-primary-foreground transition hover:bg-emerald-800"
          href="/etapas/nueva"
        >
          <Plus className="h-5 w-5" />
          Nueva etapa
        </Link>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por código, cliente, cultivo..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Todos los estados</option>
              <option value="pendiente_receta">Pendiente de receta</option>
              <option value="cliente_notificado">Cliente notificado</option>
              <option value="atendido_local">Atendido en local</option>
              <option value="venta_realizada">Venta realizada</option>
              <option value="cerrado">Cerrado</option>
              <option value="cancelado">Cancelado</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-3 p-3 md:hidden">
            {filtered.map((stage) => (
              <div key={stage.id} className="grid gap-3 rounded-md border bg-white p-3 shadow-sm">
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
                  <MobileInfo label="Técnico" value={stage.technicianName} />
                </div>

                <div className={isAdmin ? "grid grid-cols-3 gap-2" : "grid gap-2"}>
                  <Link href={`/etapas/${stage.id}`}>
                    <Button className="w-full" variant="outline" size="sm" aria-label="Ver">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  {isAdmin ? (
                    <>
                      <Link href={`/etapas/${stage.id}/ticket`}>
                        <Button className="w-full" variant="secondary" size="sm" aria-label="Imprimir">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/etapas/${stage.id}/ticket-termico`}>
                        <Button className="w-full" variant="outline" size="sm" aria-label="Ticket">
                          <ReceiptText className="h-4 w-4" />
                        </Button>
                      </Link>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
            {!filtered.length ? (
              <p className="rounded-md border bg-white px-4 py-6 text-center text-sm text-muted-foreground">
                No se encontraron etapas.
              </p>
            ) : null}
          </div>

          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-emerald-50 text-xs uppercase text-emerald-900">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Cultivo</th>
                <th className="px-4 py-3">Sitio</th>
                <th className="px-4 py-3">Técnico</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((stage) => (
                <tr key={stage.id} className="border-t">
                  <td className="px-4 py-3 font-bold text-primary">{stage.code}</td>
                  <td className="px-4 py-3">{stage.clientName}</td>
                  <td className="px-4 py-3">{stage.cropName}</td>
                  <td className="px-4 py-3">{stage.siteName}</td>
                  <td className="px-4 py-3">{stage.technicianName}</td>
                  <td className="px-4 py-3"><StatusBadge status={stage.status} /></td>
                  <td className="px-4 py-3">{formatDate(stage.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/etapas/${stage.id}`}>
                        <Button variant="outline" size="icon" aria-label="Ver">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {isAdmin ? (
                        <>
                          <Link href={`/etapas/${stage.id}/ticket`}>
                            <Button variant="secondary" size="icon" aria-label="Imprimir">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/etapas/${stage.id}/ticket-termico`}>
                            <Button variant="outline" size="icon" aria-label="Ticket">
                              <ReceiptText className="h-4 w-4" />
                            </Button>
                          </Link>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>
    </section>
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
