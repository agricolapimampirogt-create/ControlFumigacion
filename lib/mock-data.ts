import { defaultSettings } from "@/lib/constants";
import { todayIso } from "@/lib/utils";
import type {
  AppUser,
  Client,
  Crop,
  FumigationStage,
  Notification,
  Pest,
  Product,
  PublicStage,
  Settings,
  Site,
} from "@/types";

export const seedUsers: AppUser[] = [
  {
    id: "admin-demo",
    nombre: "Administrador",
    email: "admin@agricolapimampiro.com",
    rol: "admin",
    telefono: "0980000000",
    estado: "activo",
    createdAt: todayIso(),
  },
  {
    id: "tecnico-demo",
    nombre: "Tecnico 1",
    email: "tecnico@agricolapimampiro.com",
    rol: "tecnico",
    telefono: "0990000000",
    estado: "activo",
    createdAt: todayIso(),
  },
];

export const seedClients: Client[] = [
  {
    id: "cliente-juan",
    nombres: "Juan",
    apellidos: "Cervantes",
    cedula: "1000000000",
    telefono: "0988216378",
    whatsapp: "0988216378",
    direccion: "Chalguayacu",
    sector: "Chalguayacu",
    estado: "activo",
    createdAt: todayIso(),
    updatedAt: todayIso(),
  },
  {
    id: "cliente-maria",
    nombres: "Maria",
    apellidos: "Anrango",
    telefono: "0991111111",
    whatsapp: "0991111111",
    direccion: "Pimampiro",
    sector: "El Inca",
    estado: "activo",
    createdAt: todayIso(),
    updatedAt: todayIso(),
  },
];

export const seedCrops: Crop[] = [
  { id: "cultivo-mango", nombre: "Mango", tipo: "Frutal", descripcion: "Cultivo frutal tropical", estado: "activo" },
  { id: "cultivo-tomate", nombre: "Tomate rinon", tipo: "Hortaliza", descripcion: "Produccion bajo campo abierto", estado: "activo" },
  { id: "cultivo-aguacate", nombre: "Aguacate", tipo: "Frutal", descripcion: "Variedades de altura", estado: "activo" },
];

export const seedPests: Pest[] = [
  { id: "plaga-trips", nombreComun: "Trips", nombreCientifico: "Thysanoptera", descripcion: "Dano en hojas y frutos tiernos", cultivosRelacionados: "Mango, tomate, aguacate", nivelRiesgo: "alto", estado: "activo" },
  { id: "plaga-botrytis", nombreComun: "Botrytis", nombreCientifico: "Botrytis cinerea", descripcion: "Moho gris en flor y fruto", cultivosRelacionados: "Tomate, frutales", nivelRiesgo: "medio", estado: "activo" },
  { id: "plaga-mancha", nombreComun: "Mancha foliar", descripcion: "Lesiones en hojas con necrosis", cultivosRelacionados: "Mango, aguacate", nivelRiesgo: "medio", estado: "activo" },
];

export const seedProducts: Product[] = [
  { id: "producto-kanon", nombre: "Kanon Plus", marca: "Agroline", unidadMedida: "unidad", tipoProducto: "Fungicida", descripcion: "Producto interno registrado por tecnico", stock: 24, estado: "activo" },
  { id: "producto-duplex", nombre: "Duplex 500gr", marca: "Agroline", unidadMedida: "500gr", tipoProducto: "Insecticida", descripcion: "Presentacion de 500 gramos", stock: 18, estado: "activo" },
  { id: "producto-tieso", nombre: "Tieso 100gr", marca: "Campo Verde", unidadMedida: "100gr", tipoProducto: "Coadyuvante", descripcion: "Apoyo para mezcla", stock: 40, estado: "activo" },
];

export const seedSites: Site[] = [
  { id: "sitio-chalguayacu", nombre: "Chalguayacu", metrosSobreNivelMar: 2150, temperatura: "18 C", coordenadas: "0.39,-77.94", sector: "Chalguayacu", estado: "activo" },
  { id: "sitio-el-inca", nombre: "El Inca", metrosSobreNivelMar: 2200, temperatura: "17 C", coordenadas: "0.38,-77.93", sector: "Pimampiro", estado: "activo" },
];

export const seedStages: FumigationStage[] = [
  {
    id: "stage-demo",
    code: `AP-${new Date().getFullYear()}-5K82Q`,
    clientId: "cliente-juan",
    clientName: "Juan Cervantes",
    clientPhone: "0988216378",
    cropId: "cultivo-mango",
    cropName: "Mango",
    siteId: "sitio-chalguayacu",
    siteName: "Chalguayacu",
    pests: [
      { pestId: "plaga-trips", name: "Trips" },
      { pestId: "plaga-botrytis", name: "Botrytis" },
      { pestId: "plaga-mancha", name: "Mancha foliar" },
    ],
    technicalObservation: "Cultivo presenta dano en hojas y fruto en formacion.",
    products: [
      { productId: "producto-kanon", name: "Kanon Plus", quantity: 1 },
      { productId: "producto-duplex", name: "Duplex 500gr", quantity: 1 },
      { productId: "producto-tieso", name: "Tieso 100gr", quantity: 1 },
    ],
    status: "pendiente_receta",
    technicianId: "tecnico-demo",
    technicianName: "Tecnico 1",
    createdAt: todayIso(),
    updatedAt: todayIso(),
  },
];

export const seedPublicStages: PublicStage[] = seedStages.map(
  ({
    id,
    code,
    clientName,
    cropName,
    siteName,
    pests,
    technicalObservation,
    status,
    cropPhotoUrl,
    createdAt,
  }) => ({
    id,
    code,
    clientName,
    cropName,
    siteName,
    pests,
    technicalObservation,
    status,
    cropPhotoUrl,
    createdAt,
  }),
);

export const seedNotifications: Notification[] = [];
export const seedSettings: Settings = defaultSettings;
