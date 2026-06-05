"use client";

import { EntityManager } from "@/components/entity-manager";
import { userSchema } from "@/lib/schemas";
import { deleteUser, listUsers, saveUser } from "@/lib/data";

export default function UsuariosPage() {
  return (
    <EntityManager
      title="Usuarios"
      description="Administradores y tecnicos con acceso al sistema."
      schema={userSchema}
      load={listUsers}
      save={saveUser}
      remove={deleteUser}
      fields={[
        { name: "nombre", label: "Nombre" },
        { name: "email", label: "Email" },
        { name: "rol", label: "Rol", type: "select", options: [{ value: "tecnico", label: "Tecnico" }, { value: "admin", label: "Administrador" }] },
        { name: "telefono", label: "Telefono" },
        { name: "estado", label: "Estado", type: "select", options: [{ value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }] },
      ]}
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "email", label: "Email" },
        { key: "rol", label: "Rol" },
        { key: "estado", label: "Estado" },
      ]}
    />
  );
}
