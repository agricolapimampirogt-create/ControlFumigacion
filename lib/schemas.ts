import { z } from "zod";

export const entityStatusSchema = z.enum(["activo", "inactivo"]);

export const clientSchema = z.object({
  nombres: z.string().min(2, "Ingrese nombres"),
  apellidos: z.string().min(2, "Ingrese apellidos"),
  cedula: z.string().optional(),
  telefono: z.string().min(7, "Teléfono requerido"),
  whatsapp: z.string().min(7, "WhatsApp requerido"),
  direccion: z.string().optional(),
  sector: z.string().optional(),
  estado: entityStatusSchema.default("activo"),
});

export const cropSchema = z.object({
  nombre: z.string().min(2),
  tipo: z.string().min(2),
  descripcion: z.string().optional(),
  estado: entityStatusSchema.default("activo"),
});

export const pestSchema = z.object({
  nombreComun: z.string().min(2),
  nombreCientifico: z.string().optional(),
  descripcion: z.string().optional(),
  cultivosRelacionados: z.string().optional(),
  nivelRiesgo: z.enum(["bajo", "medio", "alto"]).default("medio"),
  estado: entityStatusSchema.default("activo"),
});

export const productSchema = z.object({
  nombre: z.string().min(2),
  marca: z.string().optional(),
  unidadMedida: z.string().min(1),
  tipoProducto: z.string().min(2),
  descripcion: z.string().optional(),
  stock: z.coerce.number().optional(),
  estado: entityStatusSchema.default("activo"),
});

export const siteSchema = z.object({
  nombre: z.string().min(2),
  metrosSobreNivelMar: z.coerce.number().optional(),
  temperatura: z.string().optional(),
  coordenadas: z.string().optional(),
  sector: z.string().optional(),
  estado: entityStatusSchema.default("activo"),
});

export const userSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  rol: z.enum(["admin", "tecnico"]).default("tecnico"),
  telefono: z.string().optional(),
  estado: entityStatusSchema.default("activo"),
});

export const stageSchema = z.object({
  clientId: z.string().min(1, "Seleccione cliente"),
  clientPhone: z.string().min(7),
  cropId: z.string().min(1, "Seleccione cultivo"),
  siteId: z.string().min(1, "Seleccione sitio"),
  pestIds: z.array(z.string()).min(1, "Seleccione al menos una plaga"),
  technicalObservation: z.string().min(10, "Agregue una observación técnica"),
  products: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().positive(),
      }),
    )
    .min(1, "Agregue al menos un producto"),
  status: z
    .enum([
      "pendiente_receta",
      "cliente_notificado",
      "atendido_local",
      "venta_realizada",
      "cerrado",
      "cancelado",
    ])
    .default("pendiente_receta"),
  cropPhotoUrl: z.string().optional(),
  internalNotes: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
export type CropFormValues = z.infer<typeof cropSchema>;
export type PestFormValues = z.infer<typeof pestSchema>;
export type ProductFormValues = z.infer<typeof productSchema>;
export type SiteFormValues = z.infer<typeof siteSchema>;
export type UserFormValues = z.infer<typeof userSchema>;
export type StageFormValues = z.infer<typeof stageSchema>;
