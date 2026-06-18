"use client";

import { EntityManager } from "@/components/entity-manager";
import { siteSchema } from "@/lib/schemas";
import { deleteSite, listSites, saveSite } from "@/lib/data";

export default function SitiosPage() {
  return (
    <EntityManager
      title="Sitios"
      description="Sectores y ubicaciones de atención técnica."
      schema={siteSchema}
      load={listSites}
      save={saveSite}
      remove={deleteSite}
      fields={[
        { name: "nombre", label: "Nombre" },
        { name: "metrosSobreNivelMar", label: "Metros sobre nivel del mar", type: "number" },
        { name: "temperatura", label: "Temperatura" },
        { name: "coordenadas", label: "Coordenadas" },
        { name: "sector", label: "Sector" },
        { name: "estado", label: "Estado", type: "select", options: [{ value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }] },
      ]}
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "sector", label: "Sector" },
        { key: "metrosSobreNivelMar", label: "MSNM" },
        { key: "estado", label: "Estado" },
      ]}
    />
  );
}
