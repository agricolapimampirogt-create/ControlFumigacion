export type Role = "admin" | "tecnico";

export type EntityStatus = "activo" | "inactivo";

export type StageStatus =
  | "pendiente_receta"
  | "cliente_notificado"
  | "atendido_local"
  | "venta_realizada"
  | "cerrado"
  | "cancelado";

export type AppUser = {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  telefono?: string;
  estado: EntityStatus;
  createdAt?: string;
};

export type Client = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula?: string;
  telefono: string;
  whatsapp: string;
  direccion?: string;
  sector?: string;
  estado: EntityStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type Crop = {
  id: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  estado: EntityStatus;
};

export type Pest = {
  id: string;
  nombreComun: string;
  nombreCientifico?: string;
  descripcion?: string;
  cultivosRelacionados?: string;
  nivelRiesgo: "bajo" | "medio" | "alto";
  estado: EntityStatus;
};

export type Product = {
  id: string;
  nombre: string;
  marca?: string;
  unidadMedida: string;
  tipoProducto: string;
  descripcion?: string;
  stock?: number;
  estado: EntityStatus;
};

export type Site = {
  id: string;
  nombre: string;
  metrosSobreNivelMar?: number;
  temperatura?: string;
  coordenadas?: string;
  sector?: string;
  estado: EntityStatus;
};

export type StagePest = {
  pestId: string;
  name: string;
};

export type StageProduct = {
  productId: string;
  name: string;
  quantity: number;
};

export type FumigationStage = {
  id: string;
  code: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  cropId: string;
  cropName: string;
  siteId: string;
  siteName: string;
  pests: StagePest[];
  technicalObservation: string;
  products: StageProduct[];
  status: StageStatus;
  technicianId: string;
  technicianName: string;
  cropPhotoUrl?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicStage = Pick<
  FumigationStage,
  | "id"
  | "code"
  | "clientName"
  | "cropName"
  | "siteName"
  | "pests"
  | "technicalObservation"
  | "status"
  | "cropPhotoUrl"
  | "createdAt"
>;

export type Notification = {
  id: string;
  stageId: string;
  code: string;
  clientName: string;
  channel: "whatsapp";
  status: "pendiente" | "enviado";
  createdAt: string;
};

export type Settings = {
  id: "main";
  businessName: string;
  address: string;
  phone: string;
  whatsapp: string;
  photoUrl: string;
  publicBaseUrl: string;
};
