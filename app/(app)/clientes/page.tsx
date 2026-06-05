"use client";

import { EntityManager } from "@/components/entity-manager";
import { clientSchema } from "@/lib/schemas";
import { deleteClient, listClients, saveClient } from "@/lib/data";

export default function ClientesPage() {
  return (
    <EntityManager
      title="Clientes"
      description="Agricultores y contactos registrados por campo o local."
      schema={clientSchema}
      load={listClients}
      save={saveClient}
      remove={deleteClient}
      fields={[
        { name: "nombres", label: "Nombres" },
        { name: "apellidos", label: "Apellidos" },
        { name: "cedula", label: "Cedula" },
        { name: "telefono", label: "Telefono" },
        { name: "whatsapp", label: "WhatsApp" },
        { name: "direccion", label: "Direccion" },
        { name: "sector", label: "Sector" },
        { name: "estado", label: "Estado", type: "select", options: [{ value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }] },
      ]}
      columns={[
        { key: "nombres", label: "Nombres" },
        { key: "apellidos", label: "Apellidos" },
        { key: "telefono", label: "Telefono" },
        { key: "sector", label: "Sector" },
        { key: "estado", label: "Estado" },
      ]}
    />
  );
}
