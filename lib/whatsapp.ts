import { defaultSettings, statusLabels } from "@/lib/constants";
import { normalizePhoneForWhatsapp } from "@/lib/utils";
import type { FumigationStage, Settings } from "@/types";

const customerPortalBaseUrl = "https://agricolapimampiro.netlify.app";

export function buildPublicUrl(code: string, settings: Settings = defaultSettings) {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_PUBLIC_BASE_URL || settings.publicBaseUrl || defaultSettings.publicBaseUrl;
  const baseUrl = configuredBaseUrl.includes("agricolapimampiro.com")
    ? customerPortalBaseUrl
    : configuredBaseUrl;
  return `${baseUrl.replace(/\/$/, "")}/consulta/${code}`;
}

export function buildWhatsappMessage(
  stage: FumigationStage,
  settings: Settings = defaultSettings,
) {
  const pests = stage.pests.map((pest) => pest.name).join(", ");
  return [
    "Hola, estimado/a agricultor/a",
    "",
    `Su registro de control de fumigación fue realizado exitosamente en ${settings.businessName}.`,
    "",
    `Código: ${stage.code}`,
    `Cliente: ${stage.clientName}`,
    `Cultivo: ${stage.cropName}`,
    `Sitio: ${stage.siteName}`,
    `Plagas detectadas: ${pests}`,
    `Observación técnica: ${stage.technicalObservation}`,
    `Estado: ${statusLabels[stage.status]}`,
    "",
    `Puede consultar su registro en el siguiente enlace: ${buildPublicUrl(stage.code, settings)}`,
    "",
    "Para recibir la recomendación completa y adquirir los productos adecuados para su cultivo, acérquese a nuestro local físico.",
    "",
    `Dirección: ${settings.address}`,
    `Contacto: ${settings.phone}`,
    "",
    settings.businessName,
    "Al servicio del Agricultor.",
  ].join("\n");
}

export function buildWhatsappUrl(phone: string, message: string) {
  return `https://wa.me/${normalizePhoneForWhatsapp(phone)}?text=${encodeURIComponent(message)}`;
}
