"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ZodTypeAny } from "zod";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";

export type FieldConfig<T> = {
  name: keyof T & string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  options?: { value: string; label: string }[];
};

type EntityManagerProps<T extends { id: string; estado?: string }> = {
  title: string;
  description: string;
  fields: FieldConfig<T>[];
  columns: { key: keyof T & string; label: string }[];
  schema: ZodTypeAny;
  load: () => Promise<T[]>;
  save: (value: Omit<T, "id"> & { id?: string }) => Promise<T>;
  remove?: (id: string) => Promise<void>;
  adminOnlyDelete?: boolean;
};

export function EntityManager<T extends { id: string; estado?: string }>({
  title,
  description,
  fields,
  columns,
  schema,
  load,
  save,
  remove,
  adminOnlyDelete = true,
}: EntityManagerProps<T>) {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<T[]>([]);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
  });

  async function refresh() {
    setRows(await load());
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [query, rows]);

  function startCreate() {
    setEditing(null);
    setFormError("");
    reset({ estado: "activo" });
    setOpen(true);
  }

  function startEdit(row: T) {
    setEditing(row);
    setFormError("");
    reset(row);
    setOpen(true);
  }

  async function onSubmit(values: Record<string, unknown>) {
    setFormError("");
    try {
      await save({ ...values, id: editing?.id } as Omit<T, "id"> & { id?: string });
      setOpen(false);
      await refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar en Firebase.");
    }
  }

  function deleteLabel(row: T | null) {
    if (!row) return "este registro";
    const primaryColumn = columns[0];
    return primaryColumn ? String(row[primaryColumn.key] ?? "este registro") : "este registro";
  }

  async function confirmDelete() {
    if (!remove || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="grid gap-4 sm:gap-5">
      <div className="grid gap-3 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-black text-emerald-950 sm:text-2xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={startCreate} size="lg">
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {open ? (
        <Card className="overflow-hidden">
          <CardHeader className="p-3 sm:p-4">
            <h2 className="text-base font-bold sm:text-lg">{editing ? "Editar registro" : "Nuevo registro"}</h2>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {formError ? (
              <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {formError}
              </p>
            ) : null}
            <form className="grid min-w-0 gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              {fields.map((field) => {
                const error = errors[field.name]?.message as string | undefined;
                return (
                  <Field key={field.name} label={field.label} error={error}>
                    {field.type === "textarea" ? (
                      <Textarea {...register(field.name)} />
                    ) : field.type === "select" ? (
                      <Select {...register(field.name)}>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input type={field.type || "text"} {...register(field.name)} />
                    )}
                  </Field>
                );
              })}
              <div className="grid gap-2 sm:grid-cols-2 md:col-span-2 md:flex">
                <Button className="w-full md:w-auto" type="submit" disabled={isSubmitting}>
                  Guardar
                </Button>
                <Button className="w-full md:w-auto" type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-3 p-3 md:hidden">
            {filtered.map((row) => {
              const primary = columns[0];
              const secondary = columns[1];
              const details = columns.slice(2);
              return (
                <div key={row.id} className="grid gap-3 rounded-md border bg-white p-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="break-words text-base font-black text-primary">{String(row[primary.key] ?? "")}</p>
                    {secondary ? (
                      <p className="mt-1 break-words text-sm text-muted-foreground">{String(row[secondary.key] ?? "")}</p>
                    ) : null}
                  </div>

                  {details.length ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {details.map((column) => (
                        <div key={column.key} className="min-w-0">
                          <p className="text-[11px] font-bold uppercase text-muted-foreground">{column.label}</p>
                          <p className="break-words font-medium text-emerald-950">{String(row[column.key] ?? "")}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <Button className="w-full" variant="outline" size="sm" onClick={() => startEdit(row)} aria-label="Editar">
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    {remove && (!adminOnlyDelete || isAdmin) ? (
                      <Button className="w-full" variant="danger" size="sm" onClick={() => setDeleteTarget(row)} aria-label="Eliminar">
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {!filtered.length ? (
              <p className="rounded-md border bg-white px-4 py-6 text-center text-sm text-muted-foreground">
                No se encontraron registros.
              </p>
            ) : null}
          </div>

          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-emerald-50 text-xs uppercase text-emerald-900">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-bold">
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {String(row[column.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => startEdit(row)} aria-label="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {remove && (!adminOnlyDelete || isAdmin) ? (
                        <Button variant="danger" size="icon" onClick={() => setDeleteTarget(row)} aria-label="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        description={`Desea eliminar "${deleteLabel(deleteTarget)}"? Esta accion no se puede deshacer.`}
        busy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
