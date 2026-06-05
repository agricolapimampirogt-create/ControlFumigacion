"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Plus, Save, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { generateUniqueStageCode } from "@/lib/code";
import { statusTone } from "@/lib/constants";
import {
  clientDisplayName,
  createNotification,
  getSettings,
  listClients,
  listCrops,
  listPests,
  listProducts,
  listSites,
  saveClient,
  saveStage,
} from "@/lib/data";
import { stageSchema, type StageFormValues } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { buildWhatsappMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import type { Client, Crop, FumigationStage, Pest, Product, Site } from "@/types";

type StageFormProps = {
  initial?: FumigationStage;
};

const emptyStageValues: StageFormValues = {
  clientId: "",
  clientPhone: "",
  cropId: "",
  siteId: "",
  pestIds: [],
  products: [{ productId: "", quantity: 1 }],
  technicalObservation: "",
  status: "pendiente_receta",
  cropPhotoUrl: "",
  internalNotes: "",
};

function valuesFromStage(initial?: FumigationStage): StageFormValues {
  if (!initial) return emptyStageValues;

  return {
    clientId: initial.clientId,
    clientPhone: initial.clientPhone,
    cropId: initial.cropId,
    siteId: initial.siteId,
    pestIds: initial.pests.map((pest) => pest.pestId),
    products: initial.products.map((product) => ({
      productId: product.productId,
      quantity: product.quantity,
    })),
    technicalObservation: initial.technicalObservation,
    status: initial.status,
    cropPhotoUrl: initial.cropPhotoUrl || "",
    internalNotes: initial.internalNotes || "",
  };
}

function uniqueById<T extends { id: string }>(rows: T[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function activeRows<T extends { estado?: string }>(rows: T[]) {
  return rows.filter((item) => !item.estado || item.estado === "activo");
}

function initialClient(initial?: FumigationStage): Client[] {
  if (!initial) return [];
  return [
    {
      id: initial.clientId,
      nombres: initial.clientName,
      apellidos: "",
      telefono: initial.clientPhone,
      whatsapp: initial.clientPhone,
      estado: "activo",
    },
  ];
}

function initialCrop(initial?: FumigationStage): Crop[] {
  if (!initial) return [];
  return [{ id: initial.cropId, nombre: initial.cropName, tipo: "Registrado en etapa", estado: "activo" }];
}

function initialSite(initial?: FumigationStage): Site[] {
  if (!initial) return [];
  return [{ id: initial.siteId, nombre: initial.siteName, estado: "activo" }];
}

function initialPests(initial?: FumigationStage): Pest[] {
  return (
    initial?.pests.map((pest) => ({
      id: pest.pestId,
      nombreComun: pest.name,
      nivelRiesgo: "medio" as const,
      estado: "activo" as const,
    })) || []
  );
}

function initialProducts(initial?: FumigationStage): Product[] {
  return (
    initial?.products.map((product) => ({
      id: product.productId,
      nombre: product.name,
      unidadMedida: "",
      tipoProducto: "Registrado en etapa",
      estado: "activo" as const,
    })) || []
  );
}

export function StageForm({ initial }: StageFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [pests, setPests] = useState<Pest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productDeleteIndex, setProductDeleteIndex] = useState<number | null>(null);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
    defaultValues: valuesFromStage(initial),
  });

  const productRows = useFieldArray({ control, name: "products" });
  const selectedClientId = watch("clientId");

  useEffect(() => {
    async function loadCatalogs() {
      const [clientRows, cropRows, siteRows, pestRows, productCatalog] = await Promise.all([
        listClients(),
        listCrops(),
        listSites(),
        listPests(),
        listProducts(),
      ]);
      setClients(uniqueById([...activeRows(clientRows), ...initialClient(initial)]));
      setCrops(uniqueById([...activeRows(cropRows), ...initialCrop(initial)]));
      setSites(uniqueById([...activeRows(siteRows), ...initialSite(initial)]));
      setPests(uniqueById([...activeRows(pestRows), ...initialPests(initial)]));
      setProducts(uniqueById([...activeRows(productCatalog), ...initialProducts(initial)]));
    }
    loadCatalogs();
  }, [initial]);

  useEffect(() => {
    reset(valuesFromStage(initial));
  }, [initial, reset]);

  useEffect(() => {
    if (!initial) return;
    if (!clients.length || !crops.length || !sites.length || !products.length) return;
    reset(valuesFromStage(initial));
  }, [clients.length, crops.length, initial, products.length, reset, sites.length]);

  useEffect(() => {
    const client = clients.find((item) => item.id === selectedClientId);
    if (client) setValue("clientPhone", client.whatsapp || client.telefono);
  }, [clients, selectedClientId, setValue]);

  const selectedPests = watch("pestIds") || [];
  const selectedStatus = watch("status");

  const productOptions = useMemo(
    () =>
      products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.nombre} {product.unidadMedida ? `- ${product.unidadMedida}` : ""}
        </option>
      )),
    [products],
  );

  async function createQuickClient() {
    if (!quickName || !quickPhone) return;
    const parts = quickName.trim().split(/\s+/);
    const created = await saveClient({
      nombres: parts.slice(0, -1).join(" ") || quickName,
      apellidos: parts.at(-1) || "",
      telefono: quickPhone,
      whatsapp: quickPhone,
      direccion: "",
      sector: "",
      estado: "activo",
    });
    setClients((current) => [created, ...current]);
    setValue("clientId", created.id);
    setValue("clientPhone", created.whatsapp);
    setQuickName("");
    setQuickPhone("");
  }

  function confirmProductDelete() {
    if (productDeleteIndex === null) return;
    productRows.remove(productDeleteIndex);
    setProductDeleteIndex(null);
  }

  async function onSubmit(values: StageFormValues) {
    if (!user) return;
    const client = clients.find((item) => item.id === values.clientId);
    const crop = crops.find((item) => item.id === values.cropId);
    const site = sites.find((item) => item.id === values.siteId);
    if (!client || !crop || !site) return;

    const stagePests = values.pestIds
      .map((id) => pests.find((pest) => pest.id === id))
      .filter(Boolean)
      .map((pest) => ({ pestId: pest!.id, name: pest!.nombreComun }));

    const stageProducts = values.products
      .map((row) => {
        const product = products.find((item) => item.id === row.productId);
        return product ? { productId: product.id, name: product.nombre, quantity: Number(row.quantity) } : null;
      })
      .filter(Boolean) as FumigationStage["products"];

    const saved = await saveStage({
      id: initial?.id,
      code: initial?.code || (await generateUniqueStageCode()),
      clientId: client.id,
      clientName: clientDisplayName(client),
      clientPhone: values.clientPhone,
      cropId: crop.id,
      cropName: crop.nombre,
      siteId: site.id,
      siteName: site.nombre,
      pests: stagePests,
      technicalObservation: values.technicalObservation,
      products: stageProducts,
      status: values.status,
      technicianId: initial?.technicianId || user.id,
      technicianName: initial?.technicianName || user.nombre,
      cropPhotoUrl: values.cropPhotoUrl,
      internalNotes: values.internalNotes,
    });

    const settings = await getSettings();
    const url = buildWhatsappUrl(saved.clientPhone, buildWhatsappMessage(saved, settings));
    setWhatsappUrl(url);
    await createNotification(saved);
    window.open(url, "_blank", "noopener,noreferrer");
    router.push(`/etapas/${saved.id}`);
  }

  return (
    <form className="grid min-w-0 gap-4 sm:gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-3 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-black leading-tight text-emerald-950 sm:text-2xl">{initial ? "Editar etapa" : "Nueva etapa de fumigacion"}</h1>
          <p className="text-sm text-muted-foreground">Registro tecnico con privacidad para consulta del cliente.</p>
        </div>
        <Button className="w-full sm:w-auto" type="submit" size="lg" disabled={isSubmitting}>
          <Save className="h-5 w-5" />
          Guardar etapa
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-4">
          <h2 className="font-bold">Cliente y ubicacion</h2>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-4 p-3 sm:p-4 lg:grid-cols-3">
          <Field label="Cliente" error={errors.clientId?.message}>
            <Select {...register("clientId")}>
              <option value="">Seleccione cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {clientDisplayName(client)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Telefono / WhatsApp" error={errors.clientPhone?.message}>
            <Input {...register("clientPhone")} />
          </Field>
          <Field label="Cultivo" error={errors.cropId?.message}>
            <Select {...register("cropId")}>
              <option value="">Seleccione cultivo</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sitio" error={errors.siteId?.message}>
            <Select {...register("siteId")}>
              <option value="">Seleccione sitio</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Foto del cultivo (URL opcional)">
            <Input {...register("cropPhotoUrl")} placeholder="https://..." />
          </Field>
          <Field label="Estado" error={errors.status?.message}>
            <Select className={cn("font-semibold", statusTone[selectedStatus])} {...register("status")}>
              <option value="pendiente_receta">Pendiente de receta</option>
              <option value="cliente_notificado">Cliente notificado</option>
              <option value="atendido_local">Atendido en local</option>
              <option value="venta_realizada">Venta realizada</option>
              <option value="cerrado">Cerrado</option>
              <option value="cancelado">Cancelado</option>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-4">
          <h2 className="font-bold">Cliente rapido desde campo</h2>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-3 p-3 sm:grid-cols-[1fr_180px_auto] sm:p-4">
          <Input placeholder="Nombre del agricultor" value={quickName} onChange={(event) => setQuickName(event.target.value)} />
          <Input placeholder="WhatsApp" value={quickPhone} onChange={(event) => setQuickPhone(event.target.value)} />
          <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={createQuickClient}>
            <UserPlus className="h-4 w-4" />
            Crear
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-4">
          <h2 className="font-bold">Plagas detectadas</h2>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pests.map((pest) => (
              <label key={pest.id} className="flex items-center gap-3 rounded-md border bg-white p-3 text-sm font-medium">
                <input
                  type="checkbox"
                  value={pest.id}
                  {...register("pestIds")}
                  className="h-5 w-5 accent-emerald-700"
                  defaultChecked={selectedPests.includes(pest.id)}
                />
                {pest.nombreComun}
              </label>
            ))}
          </div>
          {errors.pestIds?.message ? <p className="mt-2 text-xs font-medium text-red-600">{errors.pestIds.message}</p> : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-4">
          <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
            <h2 className="font-bold">Productos internos a aplicar</h2>
            <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={() => productRows.append({ productId: "", quantity: 1 })}>
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-3 p-3 md:hidden">
            {productRows.fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-md border bg-white p-3">
                <Field label="Producto">
                  <Select {...register(`products.${index}.productId`)}>
                    <option value="">Seleccione producto</option>
                    {productOptions}
                  </Select>
                </Field>
                <Field label="Cantidad">
                  <Input type="number" min="0.01" step="0.01" {...register(`products.${index}.quantity`)} />
                </Field>
                <Button className="w-full" type="button" variant="danger" size="sm" onClick={() => setProductDeleteIndex(index)} aria-label="Eliminar">
                  <Trash2 className="h-4 w-4" />
                  Eliminar producto
                </Button>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-emerald-50 text-xs uppercase text-emerald-900">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="w-36 px-4 py-3">Cantidad</th>
                <th className="w-20 px-4 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody>
              {productRows.fields.map((field, index) => (
                <tr key={field.id} className="border-t">
                  <td className="px-4 py-3">
                    <Select {...register(`products.${index}.productId`)}>
                      <option value="">Seleccione producto</option>
                      {productOptions}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Input type="number" min="0.01" step="0.01" {...register(`products.${index}.quantity`)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button type="button" variant="danger" size="icon" onClick={() => setProductDeleteIndex(index)} aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {errors.products?.message ? <p className="p-4 text-xs font-medium text-red-600">{errors.products.message}</p> : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="p-3 sm:p-4">
          <h2 className="font-bold">Observaciones</h2>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-4 p-3 sm:p-4 lg:grid-cols-2">
          <Field label="Observacion tecnica para el cliente" error={errors.technicalObservation?.message}>
            <Textarea {...register("technicalObservation")} />
          </Field>
          <Field label="Observaciones internas">
            <Textarea {...register("internalNotes")} />
          </Field>
        </CardContent>
      </Card>

      {whatsappUrl ? (
        <a className="inline-flex items-center gap-2 text-sm font-semibold text-primary" href={whatsappUrl} target="_blank">
          <ExternalLink className="h-4 w-4" />
          Abrir mensaje de WhatsApp
        </a>
      ) : null}
      <ConfirmDialog
        open={productDeleteIndex !== null}
        description="Desea eliminar este producto de la etapa?"
        onCancel={() => setProductDeleteIndex(null)}
        onConfirm={confirmProductDelete}
      />
    </form>
  );
}
