"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bug,
  Camera,
  ExternalLink,
  FileText,
  Lock,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Save,
  Search,
  Sprout,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
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
  getClientSiteCount,
  getSettings,
  saveClient,
  saveStage,
  searchClients,
  searchCropsForSite,
  searchPests,
  searchProducts,
  searchSitesForClient,
} from "@/lib/data";
import { stageSchema, type StageFormValues } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { buildWhatsappMessage, buildWhatsappUrl } from "@/lib/whatsapp";
import type { Client, Crop, FumigationStage, Pest, Product, Site } from "@/types";

type StageFormProps = {
  initial?: FumigationStage;
};

type ClientOption = Client & { siteCount?: number };
type ProductItem = { product: Product; quantity: number };

const draftKey = "agricola:stage-draft";

const emptyStageValues: StageFormValues = {
  clientId: "",
  clientPhone: "",
  cropId: "",
  siteId: "",
  pestIds: [],
  products: [],
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

function initialClient(initial?: FumigationStage): Client | null {
  if (!initial) return null;
  return {
    id: initial.clientId,
    nombres: initial.clientName,
    apellidos: "",
    telefono: initial.clientPhone,
    whatsapp: initial.clientPhone,
    estado: "activo",
  };
}

function initialSite(initial?: FumigationStage): Site | null {
  if (!initial) return null;
  return { id: initial.siteId, nombre: initial.siteName, estado: "activo" };
}

function initialCrop(initial?: FumigationStage): Crop | null {
  if (!initial) return null;
  return { id: initial.cropId, nombre: initial.cropName, tipo: "Registrado en etapa", estado: "activo" };
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

function initialProducts(initial?: FumigationStage): ProductItem[] {
  return (
    initial?.products.map((product) => ({
      product: {
        id: product.productId,
        nombre: product.name,
        unidadMedida: "",
        tipoProducto: "Registrado en etapa",
        estado: "activo" as const,
      },
      quantity: product.quantity,
    })) || []
  );
}

function SectionTitle({ icon, title, detail }: { icon: ReactNode; title: string; detail?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-emerald-50 text-primary">{icon}</span>
      <div className="min-w-0">
        <h2 className="text-base font-black text-emerald-950">{title}</h2>
        {detail ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed bg-emerald-50/50 px-3 py-4 text-center text-sm text-muted-foreground">{children}</p>;
}

function SearchBox<T extends { id: string }>({
  label,
  placeholder,
  disabled,
  selectedLabel,
  search,
  onSelect,
  renderResult,
  emptyText = "Sin resultados",
}: {
  label: string;
  placeholder: string;
  disabled?: boolean;
  selectedLabel?: string;
  search: (term: string) => Promise<T[]>;
  onSelect: (item: T) => void;
  renderResult: (item: T) => ReactNode;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<T[]>([]);

  useEffect(() => {
    if (!open || disabled) return;

    let active = true;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await search(query);
        if (active) setResults(rows.slice(0, 20));
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [disabled, open, query, search]);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-black text-emerald-950">{label}</label>
      {selectedLabel ? (
        <p className="rounded-md border bg-white px-3 py-2 text-sm font-semibold text-emerald-950">{selectedLabel}</p>
      ) : null}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="h-12 pl-10"
          value={query}
          placeholder={disabled ? "Seleccione primero el paso anterior" : placeholder}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && !disabled ? (
        <div className="max-h-72 overflow-y-auto rounded-md border bg-white shadow-sm">
          {loading ? <p className="px-3 py-4 text-sm text-muted-foreground">Buscando...</p> : null}
          {!loading && results.length
            ? results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="block w-full border-b px-3 py-3 text-left last:border-b-0 hover:bg-emerald-50"
                  onClick={() => {
                    onSelect(item);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  {renderResult(item)}
                </button>
              ))
            : null}
          {!loading && !results.length ? <p className="px-3 py-4 text-sm text-muted-foreground">{emptyText}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function StageForm({ initial }: StageFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<Client | null>(() => initialClient(initial));
  const [selectedSite, setSelectedSite] = useState<Site | null>(() => initialSite(initial));
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(() => initialCrop(initial));
  const [selectedPests, setSelectedPests] = useState<Pest[]>(() => initialPests(initial));
  const [productItems, setProductItems] = useState<ProductItem[]>(() => initialProducts(initial));
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productDeleteIndex, setProductDeleteIndex] = useState<number | null>(null);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
    defaultValues: valuesFromStage(initial),
  });

  useEffect(() => {
    reset(valuesFromStage(initial));
    setSelectedClient(initialClient(initial));
    setSelectedSite(initialSite(initial));
    setSelectedCrop(initialCrop(initial));
    setSelectedPests(initialPests(initial));
    setProductItems(initialProducts(initial));
  }, [initial, reset]);

  const searchClientOptions = useCallback(async (term: string) => {
    const clients = await searchClients(term, 20);
    const counts = await Promise.all(clients.map((client) => getClientSiteCount(client.id)));
    return clients.map((client, index) => ({ ...client, siteCount: counts[index] }));
  }, []);

  const searchSiteOptions = useCallback(
    (term: string) => searchSitesForClient(selectedClient?.id || "", term, 20),
    [selectedClient?.id],
  );

  const searchCropOptions = useCallback(
    (term: string) => searchCropsForSite(selectedSite?.id || "", term, 20),
    [selectedSite?.id],
  );

  const productFormValues = useMemo(
    () => productItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    [productItems],
  );

  useEffect(() => {
    setValue("pestIds", selectedPests.map((pest) => pest.id), { shouldValidate: true });
  }, [selectedPests, setValue]);

  useEffect(() => {
    setValue("products", productFormValues, { shouldValidate: true });
  }, [productFormValues, setValue]);

  function selectClient(client: Client) {
    setSelectedClient(client);
    setSelectedSite(null);
    setSelectedCrop(null);
    setValue("clientId", client.id, { shouldValidate: true });
    setValue("clientPhone", client.whatsapp || client.telefono, { shouldValidate: true });
    setValue("siteId", "", { shouldValidate: true });
    setValue("cropId", "", { shouldValidate: true });
  }

  function selectSite(site: Site) {
    setSelectedSite(site);
    setSelectedCrop(null);
    setValue("siteId", site.id, { shouldValidate: true });
    setValue("cropId", "", { shouldValidate: true });
  }

  function selectCrop(crop: Crop) {
    setSelectedCrop(crop);
    setValue("cropId", crop.id, { shouldValidate: true });
  }

  function addPest(pest: Pest) {
    setSelectedPests((current) => (current.some((item) => item.id === pest.id) ? current : [...current, pest]));
  }

  function removePest(id: string) {
    setSelectedPests((current) => current.filter((pest) => pest.id !== id));
  }

  function syncProductItems(next: ProductItem[]) {
    setProductItems(next);
    setProductDialogOpen(false);
  }

  function addProduct(product: Product) {
    syncProductItems(
      productItems.some((item) => item.product.id === product.id)
        ? productItems
        : [...productItems, { product, quantity: 1 }],
    );
  }

  function updateProductQuantity(index: number, quantity: number) {
    const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
    syncProductItems(productItems.map((item, itemIndex) => (itemIndex === index ? { ...item, quantity: safeQuantity } : item)));
  }

  function confirmProductDelete() {
    if (productDeleteIndex === null) return;
    syncProductItems(productItems.filter((_, index) => index !== productDeleteIndex));
    setProductDeleteIndex(null);
  }

  async function createQuickClient() {
    if (!quickName || !quickPhone) return;
    setSaveError("");
    const parts = quickName.trim().split(/\s+/);
    try {
      const created = await saveClient({
        nombres: parts.slice(0, -1).join(" ") || quickName,
        apellidos: parts.at(-1) || "",
        telefono: quickPhone,
        whatsapp: quickPhone,
        direccion: "",
        sector: "",
        estado: "activo",
      });
      selectClient(created);
      setQuickName("");
      setQuickPhone("");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo crear el cliente en Firebase.");
    }
  }

  function saveDraft() {
    const values = getValues();
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        values,
        client: selectedClient,
        site: selectedSite,
        crop: selectedCrop,
        pests: selectedPests,
        products: productItems,
        savedAt: new Date().toISOString(),
      }),
    );
    setDraftMessage("Borrador guardado en este dispositivo.");
    window.setTimeout(() => setDraftMessage(""), 3000);
  }

  async function onSubmit(values: StageFormValues) {
    if (!user || !selectedClient || !selectedCrop || !selectedSite) return;
    setSaveError("");

    try {
      const stagePests = selectedPests.map((pest) => ({ pestId: pest.id, name: pest.nombreComun }));
      const stageProducts = productItems.map((item) => ({
        productId: item.product.id,
        name: item.product.nombre,
        quantity: Number(item.quantity),
      }));

      const saved = await saveStage({
        id: initial?.id,
        code: initial?.code || (await generateUniqueStageCode()),
        clientId: selectedClient.id,
        clientName: clientDisplayName(selectedClient),
        clientPhone: values.clientPhone,
        cropId: selectedCrop.id,
        cropName: selectedCrop.nombre,
        siteId: selectedSite.id,
        siteName: selectedSite.nombre,
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
      window.localStorage.removeItem(draftKey);
      window.open(url, "_blank", "noopener,noreferrer");
      router.push(`/etapas/${saved.id}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No se pudo guardar la etapa en Firebase.");
    }
  }

  return (
    <form className="grid min-w-0 gap-4 pb-36 sm:gap-5 lg:pb-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <h1 className="break-words text-2xl font-black leading-tight text-emerald-950">
          {initial ? "Editar etapa" : "Nueva etapa de fumigacion"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Captura rapida para campo con busquedas limitadas y controles tactiles.
        </p>
        {saveError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {saveError}
          </p>
        ) : null}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="p-4">
          <SectionTitle icon={<User className="h-5 w-5" />} title="Cliente" detail="Busque por nombre, telefono o cedula." />
        </CardHeader>
        <CardContent className="grid gap-4 p-4">
          <SearchBox<ClientOption>
            label="Buscar cliente"
            placeholder="Ej. Maria, 099..., cedula"
            selectedLabel={selectedClient ? clientDisplayName(selectedClient) : ""}
            search={searchClientOptions}
            onSelect={selectClient}
            renderResult={(client) => (
              <div className="grid gap-1">
                <p className="font-black text-emerald-950">{clientDisplayName(client)}</p>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {client.whatsapp || client.telefono}
                  </span>
                  <span>{client.siteCount || 0} sitios</span>
                </div>
              </div>
            )}
          />
          {errors.clientId?.message ? <p className="text-xs font-semibold text-red-600">{errors.clientId.message}</p> : null}

          {selectedClient ? (
            <div className="grid gap-2 rounded-md border bg-emerald-50 p-3">
              <p className="text-sm font-black text-emerald-950">{clientDisplayName(selectedClient)}</p>
              <p className="text-sm text-muted-foreground">{selectedClient.whatsapp || selectedClient.telefono}</p>
              {selectedClient.sector || selectedClient.direccion ? (
                <p className="text-xs font-semibold text-emerald-800">{selectedClient.sector || selectedClient.direccion}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-3 rounded-md border bg-white p-3">
            <p className="text-sm font-black text-emerald-950">Cliente rapido</p>
            <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
              <Input placeholder="Nombre del agricultor" value={quickName} onChange={(event) => setQuickName(event.target.value)} />
              <Input placeholder="WhatsApp" value={quickPhone} onChange={(event) => setQuickPhone(event.target.value)} />
              <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={createQuickClient}>
                <UserPlus className="h-4 w-4" />
                Crear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="p-4">
          <SectionTitle icon={<MapPin className="h-5 w-5" />} title="Sitio y cultivo" detail="El sitio depende del cliente y el cultivo depende del sitio." />
        </CardHeader>
        <CardContent className="grid gap-4 p-4">
          <SearchBox<Site>
            label="Sitio del cliente"
            placeholder="Buscar sitio"
            disabled={!selectedClient}
            selectedLabel={selectedSite?.nombre}
            search={searchSiteOptions}
            onSelect={selectSite}
            renderResult={(site) => (
              <div className="grid gap-1">
                <p className="font-black text-emerald-950">{site.nombre}</p>
                <p className="text-xs font-semibold text-muted-foreground">{site.sector || "Ubicacion registrada"}</p>
              </div>
            )}
            emptyText="No hay sitios relacionados. Escriba para buscar coincidencias limitadas."
          />
          {errors.siteId?.message ? <p className="text-xs font-semibold text-red-600">{errors.siteId.message}</p> : null}

          <SearchBox<Crop>
            label="Cultivo"
            placeholder="Buscar cultivo"
            disabled={!selectedSite}
            selectedLabel={selectedCrop?.nombre}
            search={searchCropOptions}
            onSelect={selectCrop}
            renderResult={(crop) => (
              <div className="flex items-center justify-between gap-3">
                <span className="font-black text-emerald-950">{crop.nombre}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-primary">{crop.tipo}</span>
              </div>
            )}
            emptyText="Seleccione un sitio o escriba para buscar cultivos."
          />
          {errors.cropId?.message ? <p className="text-xs font-semibold text-red-600">{errors.cropId.message}</p> : null}

          {selectedCrop ? (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">
                <Sprout className="h-4 w-4" />
                {selectedCrop.nombre}
              </span>
            </div>
          ) : null}

          <Field label="Foto del cultivo (URL opcional)">
            <div className="relative">
              <Camera className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input className="h-12 pl-10" {...register("cropPhotoUrl")} placeholder="https://..." />
            </div>
          </Field>

          <Field label="Estado" error={errors.status?.message}>
            <Select className={cn("h-12 font-semibold", statusTone[getValues("status")])} {...register("status")}>
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
        <CardHeader className="p-4">
          <SectionTitle icon={<Bug className="h-5 w-5" />} title="Plagas detectadas" detail="Busque y agregue plagas como etiquetas removibles." />
        </CardHeader>
        <CardContent className="grid gap-4 p-4">
          <SearchBox<Pest>
            label="Agregar plaga"
            placeholder="Buscar plaga"
            search={(term) => searchPests(term, 20)}
            onSelect={addPest}
            renderResult={(pest) => (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-emerald-950">{pest.nombreComun}</p>
                  {pest.nombreCientifico ? <p className="text-xs italic text-muted-foreground">{pest.nombreCientifico}</p> : null}
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">{pest.nivelRiesgo}</span>
              </div>
            )}
          />
          <div className="flex flex-wrap gap-2">
            {selectedPests.map((pest) => (
              <button
                key={pest.id}
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-950"
                onClick={() => removePest(pest.id)}
              >
                {pest.nombreComun}
                <X className="h-4 w-4" />
              </button>
            ))}
          </div>
          {!selectedPests.length ? <EmptyState>Agregue al menos una plaga.</EmptyState> : null}
          {errors.pestIds?.message ? <p className="text-xs font-semibold text-red-600">{errors.pestIds.message}</p> : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-emerald-200">
        <CardHeader className="bg-emerald-50 p-4">
          <SectionTitle
            icon={<Lock className="h-5 w-5" />}
            title="Receta tecnica privada"
            detail="Los productos registrados aqui no seran visibles para el cliente."
          />
        </CardHeader>
        <CardContent className="grid gap-4 p-4">
          <Button type="button" className="h-12 w-full sm:w-auto" variant="outline" onClick={() => setProductDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Agregar producto
          </Button>

          <div className="grid gap-3">
            {productItems.map((item, index) => (
              <div key={item.product.id} className="grid gap-3 rounded-md border bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-black text-emerald-950">{item.product.nombre}</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {item.product.unidadMedida || "Sin unidad"} {item.product.tipoProducto ? `- ${item.product.tipoProducto}` : ""}
                    </p>
                  </div>
                  <Button type="button" variant="danger" size="icon" onClick={() => setProductDeleteIndex(index)} aria-label="Eliminar producto">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Field label="Cantidad">
                  <Input
                    className="h-12"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) => updateProductQuantity(index, Number(event.target.value))}
                  />
                </Field>
              </div>
            ))}
          </div>
          {!productItems.length ? <EmptyState>Agregue productos de receta privada.</EmptyState> : null}
          {errors.products?.message ? <p className="text-xs font-semibold text-red-600">{errors.products.message}</p> : null}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="p-4">
          <SectionTitle icon={<FileText className="h-5 w-5" />} title="Observaciones" detail="Separe el mensaje publico de las notas internas." />
        </CardHeader>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-2">
          <div className="rounded-md border border-sky-100 bg-sky-50 p-3">
            <Field label="Mensaje para cliente" error={errors.technicalObservation?.message}>
              <div className="relative">
                <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-sky-700" />
                <Textarea className="min-h-32 pl-10" {...register("technicalObservation")} />
              </div>
            </Field>
          </div>
          <div className="rounded-md border border-amber-100 bg-amber-50 p-3">
            <Field label="Observaciones internas">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-amber-700" />
                <Textarea className="min-h-32 pl-10" {...register("internalNotes")} />
              </div>
            </Field>
          </div>
        </CardContent>
      </Card>

      {whatsappUrl ? (
        <a className="inline-flex items-center gap-2 text-sm font-semibold text-primary" href={whatsappUrl} target="_blank">
          <ExternalLink className="h-4 w-4" />
          Abrir mensaje de WhatsApp
        </a>
      ) : null}

      <div className="no-print fixed bottom-[72px] left-0 right-0 z-30 border-t bg-white/95 p-3 shadow-2xl backdrop-blur lg:sticky lg:bottom-4 lg:left-auto lg:right-auto lg:rounded-lg lg:border lg:shadow-sm">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="h-12" onClick={saveDraft}>
            Guardar borrador
          </Button>
          <Button type="submit" className="h-12" disabled={isSubmitting}>
            <Save className="h-4 w-4" />
            Guardar etapa
          </Button>
        </div>
        {draftMessage ? <p className="mt-2 text-center text-xs font-semibold text-primary">{draftMessage}</p> : null}
      </div>

      {productDialogOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-emerald-950/35 p-3 backdrop-blur-sm sm:place-items-center">
          <button className="absolute inset-0 cursor-default" type="button" aria-label="Cerrar productos" onClick={() => setProductDialogOpen(false)} />
          <section className="relative w-full max-w-lg overflow-hidden rounded-lg border bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b bg-emerald-50 p-4">
              <SectionTitle icon={<Package className="h-5 w-5" />} title="Buscar producto" detail="Resultados limitados a 20 por consulta." />
              <Button type="button" variant="ghost" size="icon" onClick={() => setProductDialogOpen(false)} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <SearchBox<Product>
                label="Producto"
                placeholder="Buscar por nombre, marca o tipo"
                search={(term) => searchProducts(term, 20)}
                onSelect={addProduct}
                renderResult={(product) => (
                  <div className="grid gap-1">
                    <p className="font-black text-emerald-950">{product.nombre}</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {product.marca || "Sin marca"} - {product.unidadMedida || "Sin unidad"} - {product.tipoProducto}
                    </p>
                  </div>
                )}
              />
            </div>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={productDeleteIndex !== null}
        description="Desea eliminar este producto de la receta privada?"
        onCancel={() => setProductDeleteIndex(null)}
        onConfirm={confirmProductDelete}
      />
    </form>
  );
}
