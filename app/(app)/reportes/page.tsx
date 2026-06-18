"use client";

import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { statusLabels, statusTone } from "@/lib/constants";
import { listStages } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { FumigationStage, StageStatus } from "@/types";

export default function ReportesPage() {
  const [stages, setStages] = useState<FumigationStage[]>([]);

  useEffect(() => {
    listStages().then(setStages);
  }, []);

  const byStatus = useMemo(() => {
    return stages.reduce<Record<string, number>>((acc, stage) => {
      acc[stage.status] = (acc[stage.status] || 0) + 1;
      return acc;
    }, {});
  }, [stages]);

  function exportCsv() {
    const rows = [
      ["codigo", "cliente", "cultivo", "sitio", "estado", "tecnico", "fecha"],
      ...stages.map((stage) => [stage.code, stage.clientName, stage.cropName, stage.siteName, stage.status, stage.technicianName, stage.createdAt]),
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte-etapas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-emerald-950">Reportes</h1>
          <p className="text-sm text-muted-foreground">Análisis operativo y exportación de registros.</p>
        </div>
        <Button onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(byStatus).map(([status, total]) => (
          <Card key={status} className={cn("border", statusTone[status as StageStatus])}>
            <CardContent>
              <p className="text-xs font-bold uppercase">{statusLabels[status as StageStatus]}</p>
              <p className="text-3xl font-black">{total}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><h2 className="font-bold">Registros para auditoría</h2></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-emerald-50"><tr><th className="p-3">Código</th><th className="p-3">Cliente</th><th className="p-3">Cultivo</th><th className="p-3">Estado</th><th className="p-3">Técnico</th></tr></thead>
            <tbody>
              {stages.map((stage) => (
                <tr key={stage.id} className="border-t"><td className="p-3 font-bold text-primary">{stage.code}</td><td className="p-3">{stage.clientName}</td><td className="p-3">{stage.cropName}</td><td className="p-3"><StatusBadge status={stage.status} /></td><td className="p-3">{stage.technicianName}</td></tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
