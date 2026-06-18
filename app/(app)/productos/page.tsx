"use client";

import { EntityManager } from "@/components/entity-manager";
import { productSchema } from "@/lib/schemas";
import { deleteProduct, listProducts, saveProduct } from "@/lib/data";

export default function ProductosPage() {
  return (
    <EntityManager
      title="Productos"
      description="Productos internos recomendados por técnicos y administración."
      schema={productSchema}
      load={listProducts}
      save={saveProduct}
      remove={deleteProduct}
      fields={[
        { name: "nombre", label: "Nombre" },
        { name: "marca", label: "Marca" },
        { name: "unidadMedida", label: "Unidad de medida" },
        { name: "tipoProducto", label: "Tipo de producto" },
        { name: "stock", label: "Stock", type: "number" },
        { name: "descripcion", label: "Descripción", type: "textarea" },
        { name: "estado", label: "Estado", type: "select", options: [{ value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }] },
      ]}
      columns={[
        { key: "nombre", label: "Nombre" },
        { key: "marca", label: "Marca" },
        { key: "unidadMedida", label: "Unidad" },
        { key: "stock", label: "Stock" },
        { key: "estado", label: "Estado" },
      ]}
    />
  );
}
