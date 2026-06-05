"use client";

import { EntityManager } from "@/components/entity-manager";
import { pestSchema } from "@/lib/schemas";
import { deletePest, listPests, savePest } from "@/lib/data";

export default function PlagasPage() {
  return (
    <EntityManager
      title="Plagas"
      description="Plagas, enfermedades y niveles de riesgo por cultivo."
      schema={pestSchema}
      load={listPests}
      save={savePest}
      remove={deletePest}
      fields={[
        { name: "nombreComun", label: "Nombre comun" },
        { name: "nombreCientifico", label: "Nombre cientifico" },
        { name: "cultivosRelacionados", label: "Cultivos relacionados" },
        { name: "nivelRiesgo", label: "Nivel de riesgo", type: "select", options: [{ value: "bajo", label: "Bajo" }, { value: "medio", label: "Medio" }, { value: "alto", label: "Alto" }] },
        { name: "descripcion", label: "Descripcion", type: "textarea" },
        { name: "estado", label: "Estado", type: "select", options: [{ value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }] },
      ]}
      columns={[
        { key: "nombreComun", label: "Nombre" },
        { key: "nombreCientifico", label: "Cientifico" },
        { key: "nivelRiesgo", label: "Riesgo" },
        { key: "estado", label: "Estado" },
      ]}
    />
  );
}
