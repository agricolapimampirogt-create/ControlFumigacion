"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listNotifications } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { Notification } from "@/types";

export default function NotificacionesPage() {
  const [rows, setRows] = useState<Notification[]>([]);

  useEffect(() => {
    listNotifications().then(setRows);
  }, []);

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-2xl font-black text-emerald-950">Notificaciones</h1>
        <p className="text-sm text-muted-foreground">Historial de mensajes enviados por WhatsApp.</p>
      </div>
      <Card>
        <CardHeader><h2 className="flex items-center gap-2 font-bold"><Bell className="h-4 w-4" />Envíos</h2></CardHeader>
        <CardContent className="grid gap-3">
          {rows.length ? rows.map((item) => (
            <div key={item.id} className="rounded-md border p-3 text-sm">
              <p className="font-bold">{item.code} · {item.clientName}</p>
              <p className="text-muted-foreground">{item.channel} · {item.status} · {formatDate(item.createdAt)}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">Aún no hay notificaciones registradas.</p>}
        </CardContent>
      </Card>
    </section>
  );
}
