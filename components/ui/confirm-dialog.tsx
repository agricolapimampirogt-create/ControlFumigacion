"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = "Confirmar eliminacion",
  description,
  confirmLabel = "Si, eliminar",
  cancelLabel = "No, cancelar",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (busy) return;
      if (event.key === "Escape") onCancel();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-emerald-950/35 p-3 backdrop-blur-sm sm:place-items-center sm:p-4">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Cerrar confirmacion" onClick={busy ? undefined : onCancel} />
      <section
        className="relative w-full max-w-md overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="flex items-start gap-3 border-b bg-emerald-50 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-red-50 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-black text-emerald-950">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <Button className="shrink-0" type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Cerrar" disabled={busy}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-2 p-4 sm:flex sm:justify-end">
          <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button className="w-full sm:w-auto" type="button" variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Eliminando..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
