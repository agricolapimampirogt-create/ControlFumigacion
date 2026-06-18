"use client";

import { EntityManager } from "@/components/entity-manager";
import { cropSchema } from "@/lib/schemas";
import { deleteCrop, listCrops, saveCrop } from "@/lib/data";

export default function CultivosPage() {
  return (
    <EntityManager
      title="Cultivos"
      description="Catálogo de cultivos atendidos por Agrícola Pimampiro."
      schema={cropSchema}
      load={listCrops}
      save={saveCrop}
      remove={deleteCrop}
      fields={[
        { name: "nombre", label: "Nombre" },
        { name: "tipo", label: "Tipo" },
        { name: "descripcion", label: "Descripción", type: "textarea" },
        { name: "estado", label: "Estado", type: "select", options: [{ value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }] },
      ]}
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "tipo", label: "Tipo" },
        { key: "estado", label: "Estado" },
      ]}
    />
  );
}
