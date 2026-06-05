import { getStageByCode } from "@/lib/data";

function randomBlock(length = 5) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";
  crypto.getRandomValues(new Uint32Array(length)).forEach((number) => {
    value += alphabet[number % alphabet.length];
  });
  return value;
}

export async function generateUniqueStageCode() {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `AP-${year}-${randomBlock()}`;
    const existing = await getStageByCode(code);
    if (!existing) return code;
  }

  return `AP-${year}-${Date.now().toString(36).toUpperCase()}`;
}
