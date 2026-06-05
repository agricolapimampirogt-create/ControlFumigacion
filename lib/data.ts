"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  seedClients,
  seedCrops,
  seedNotifications,
  seedPests,
  seedProducts,
  seedPublicStages,
  seedSettings,
  seedSites,
  seedStages,
  seedUsers,
} from "@/lib/mock-data";
import { fullName, todayIso } from "@/lib/utils";
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

type CollectionName =
  | "users"
  | "clients"
  | "crops"
  | "pests"
  | "products"
  | "sites"
  | "fumigationStages"
  | "publicStages"
  | "notifications";

type CollectionMap = {
  users: AppUser;
  clients: Client;
  crops: Crop;
  pests: Pest;
  products: Product;
  sites: Site;
  fumigationStages: FumigationStage;
  publicStages: PublicStage;
  notifications: Notification;
};

const seed: { [K in CollectionName]: CollectionMap[K][] } = {
  users: seedUsers,
  clients: seedClients,
  crops: seedCrops,
  pests: seedPests,
  products: seedProducts,
  sites: seedSites,
  fumigationStages: seedStages,
  publicStages: seedPublicStages,
  notifications: seedNotifications,
};

const collectionCache: Partial<{ [K in CollectionName]: CollectionMap[K][] }> = {};

function getCollectionCache<K extends CollectionName>(name: K) {
  return collectionCache[name] as CollectionMap[K][] | undefined;
}

function setCollectionCache<K extends CollectionName>(name: K, rows: CollectionMap[K][]) {
  (collectionCache as Record<CollectionName, unknown>)[name] = rows;
}

function hasWindow() {
  return typeof window !== "undefined";
}

function storageKey(name: CollectionName) {
  return `agricola:${name}`;
}

function readLocal<K extends CollectionName>(name: K): CollectionMap[K][] {
  if (!hasWindow()) return seed[name];
  const raw = window.localStorage.getItem(storageKey(name));
  if (!raw) {
    window.localStorage.setItem(storageKey(name), JSON.stringify(seed[name]));
    return seed[name];
  }
  return JSON.parse(raw) as CollectionMap[K][];
}

function writeLocal<K extends CollectionName>(name: K, rows: CollectionMap[K][]) {
  if (!hasWindow()) return;
  window.localStorage.setItem(storageKey(name), JSON.stringify(rows));
}

function fromFirestore<T extends { id: string }>(snapshot: { id: string; data: () => Record<string, unknown> }) {
  const data = snapshot.data();
  const normalized = Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (value && typeof value === "object" && "toDate" in value) {
        return [key, (value as { toDate: () => Date }).toDate().toISOString()];
      }
      return [key, value];
    }),
  );
  return { id: snapshot.id, ...normalized } as T;
}

function shouldUseLocalFallback(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  return code === "permission-denied" || code === "unavailable";
}

function normalizeUser(user: AppUser & { activo?: boolean }) {
  return {
    ...user,
    estado: user.estado || (user.activo === false ? "inactivo" : "activo"),
  } satisfies AppUser;
}

async function listCollection<K extends CollectionName>(name: K): Promise<CollectionMap[K][]> {
  const cached = getCollectionCache(name);
  if (cached) return [...cached] as CollectionMap[K][];

  if (!isFirebaseConfigured || !db) {
    const rows = readLocal(name);
    setCollectionCache(name, rows);
    return rows;
  }
  try {
    const snap = await getDocs(collection(db, name));
    const rows = snap.docs.map((item) => fromFirestore<CollectionMap[K]>(item));
    setCollectionCache(name, rows);
    return rows;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      const rows = readLocal(name);
      setCollectionCache(name, rows);
      return rows;
    }
    throw error;
  }
}

async function saveCollectionItem<K extends CollectionName>(
  name: K,
  value: Omit<CollectionMap[K], "id"> & { id?: string },
) {
  const now = todayIso();
  const id = value.id || crypto.randomUUID();
  const payload = { ...value, id, updatedAt: now } as CollectionMap[K];

  if (!isFirebaseConfigured || !db) {
    const rows = readLocal(name);
    const existing = rows.findIndex((item) => item.id === id);
    const next = existing >= 0 ? rows.with(existing, payload) : [payload, ...rows];
    writeLocal(name, next);
    setCollectionCache(name, next);
    return payload;
  }

  const { id: _id, ...firestorePayload } = payload;
  const ref = value.id ? doc(db, name, id) : doc(collection(db, name));
  await setDoc(
    ref,
    {
      ...firestorePayload,
      createdAt: "createdAt" in firestorePayload ? firestorePayload.createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  const saved = { ...payload, id: ref.id };
  const cached = getCollectionCache(name);
  if (cached) {
    const existing = cached.findIndex((item) => item.id === saved.id);
    setCollectionCache(name, existing >= 0 ? cached.with(existing, saved) : [saved, ...cached]);
  }
  return saved;
}

async function deleteCollectionItem(name: CollectionName, id: string) {
  if (!isFirebaseConfigured || !db) {
    const next = readLocal(name).filter((item) => item.id !== id);
    writeLocal(name, next);
    setCollectionCache(name, next);
    return;
  }
  await deleteDoc(doc(db, name, id));
  const cached = getCollectionCache(name);
  if (cached) {
    setCollectionCache(name, cached.filter((item) => item.id !== id));
  }
}

export async function listUsers() {
  const users = await listCollection("users");
  return users.map((user) => normalizeUser(user as AppUser & { activo?: boolean }));
}

export async function getUserProfile(id: string) {
  if (!isFirebaseConfigured || !db) {
    const user = readLocal("users").find((item) => item.id === id);
    return user ? normalizeUser(user) : null;
  }
  try {
    const snap = await getDoc(doc(db, "users", id));
    return snap.exists() ? normalizeUser(fromFirestore<AppUser & { activo?: boolean }>(snap)) : null;
  } catch (error) {
    if (shouldUseLocalFallback(error)) return null;
    throw error;
  }
}
export const listClients = () => listCollection("clients");
export const listCrops = () => listCollection("crops");
export const listPests = () => listCollection("pests");
export const listProducts = () => listCollection("products");
export const listSites = () => listCollection("sites");
export const listNotifications = () => listCollection("notifications");

export const saveUser = (value: Omit<AppUser, "id"> & { id?: string }) => saveCollectionItem("users", value);
export const saveClient = (value: Omit<Client, "id"> & { id?: string }) => saveCollectionItem("clients", value);
export const saveCrop = (value: Omit<Crop, "id"> & { id?: string }) => saveCollectionItem("crops", value);
export const savePest = (value: Omit<Pest, "id"> & { id?: string }) => saveCollectionItem("pests", value);
export const saveProduct = (value: Omit<Product, "id"> & { id?: string }) => saveCollectionItem("products", value);
export const saveSite = (value: Omit<Site, "id"> & { id?: string }) => saveCollectionItem("sites", value);

export const deleteClient = (id: string) => deleteCollectionItem("clients", id);
export const deleteCrop = (id: string) => deleteCollectionItem("crops", id);
export const deletePest = (id: string) => deleteCollectionItem("pests", id);
export const deleteProduct = (id: string) => deleteCollectionItem("products", id);
export const deleteSite = (id: string) => deleteCollectionItem("sites", id);
export const deleteUser = (id: string) => deleteCollectionItem("users", id);

export async function listStages(user?: AppUser | null) {
  if (!isFirebaseConfigured || !db) {
    const cached = collectionCache.fumigationStages;
    const rows = cached || readLocal("fumigationStages");
    collectionCache.fumigationStages = rows;
    return user?.rol === "tecnico" ? rows.filter((stage) => stage.technicianId === user.id) : rows;
  }

  const cached = collectionCache.fumigationStages;
  if (cached) return user?.rol === "tecnico" ? cached.filter((stage) => stage.technicianId === user.id) : [...cached];

  const ref = collection(db, "fumigationStages");
  const snap =
    user?.rol === "tecnico"
      ? query(ref, where("technicianId", "==", user.id), orderBy("createdAt", "desc"))
      : query(ref, orderBy("createdAt", "desc"));
  try {
    const result = await getDocs(snap);
    const firestoreRows = result.docs.map((item) => fromFirestore<FumigationStage>(item));
    if (firestoreRows.length) {
      collectionCache.fumigationStages = firestoreRows;
      return firestoreRows;
    }

    const rows = readLocal("fumigationStages");
    collectionCache.fumigationStages = rows;
    return user?.rol === "tecnico" ? rows.filter((stage) => stage.technicianId === user.id) : rows;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      const rows = readLocal("fumigationStages");
      collectionCache.fumigationStages = rows;
      return user?.rol === "tecnico" ? rows.filter((stage) => stage.technicianId === user.id) : rows;
    }
    throw error;
  }
}

export async function getStage(id: string) {
  const localStage = readLocal("fumigationStages").find((stage) => stage.id === id) || null;

  if (!isFirebaseConfigured || !db) {
    return localStage;
  }
  try {
    const snap = await getDoc(doc(db, "fumigationStages", id));
    return snap.exists() ? fromFirestore<FumigationStage>(snap) : localStage;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return localStage;
    }
    throw error;
  }
}

export async function getStageByCode(code: string) {
  const localStage = readLocal("fumigationStages").find((stage) => stage.code.toUpperCase() === code.toUpperCase()) || null;

  if (!isFirebaseConfigured || !db) {
    return localStage;
  }
  try {
    const snap = await getDocs(query(collection(db, "fumigationStages"), where("code", "==", code), limit(1)));
    return snap.docs[0] ? fromFirestore<FumigationStage>(snap.docs[0]) : localStage;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return localStage;
    }
    throw error;
  }
}

export async function getPublicStageByCode(code: string) {
  const localStage = readLocal("publicStages").find((stage) => stage.code.toUpperCase() === code.toUpperCase()) || null;

  if (!isFirebaseConfigured || !db) {
    return localStage;
  }
  try {
    const snap = await getDocs(query(collection(db, "publicStages"), where("code", "==", code), limit(1)));
    return snap.docs[0] ? fromFirestore<PublicStage>(snap.docs[0]) : localStage;
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return localStage;
    }
    throw error;
  }
}

function toPublicStage(stage: FumigationStage): PublicStage {
  return {
    id: stage.id,
    code: stage.code,
    clientName: stage.clientName,
    cropName: stage.cropName,
    siteName: stage.siteName,
    pests: stage.pests,
    technicalObservation: stage.technicalObservation,
    status: stage.status,
    cropPhotoUrl: stage.cropPhotoUrl,
    createdAt: stage.createdAt,
  };
}

export async function saveStage(stage: Omit<FumigationStage, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const now = todayIso();
  const payload: FumigationStage = {
    ...stage,
    id: stage.id || crypto.randomUUID(),
    createdAt: stage.id ? now : now,
    updatedAt: now,
  };

  if (!isFirebaseConfigured || !db) {
    const rows = readLocal("fumigationStages");
    const existing = rows.findIndex((item) => item.id === payload.id);
    const nextStages = existing >= 0 ? rows.with(existing, payload) : [payload, ...rows];
    writeLocal("fumigationStages", nextStages);
    collectionCache.fumigationStages = nextStages;
    const publicRows = readLocal("publicStages");
    const publicPayload = toPublicStage(payload);
    const publicExisting = publicRows.findIndex((item) => item.id === publicPayload.id);
    const nextPublicStages = publicExisting >= 0 ? publicRows.with(publicExisting, publicPayload) : [publicPayload, ...publicRows];
    writeLocal("publicStages", nextPublicStages);
    collectionCache.publicStages = nextPublicStages;
    return payload;
  }

  const ref = stage.id ? doc(db, "fumigationStages", stage.id) : doc(collection(db, "fumigationStages"));
  const firestorePayload = {
    ...payload,
    id: ref.id,
    createdAt: stage.id ? payload.createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, firestorePayload, { merge: true });
  await setDoc(doc(db, "publicStages", ref.id), toPublicStage({ ...payload, id: ref.id }), { merge: true });
  const saved = { ...payload, id: ref.id };
  const cachedStages = collectionCache.fumigationStages;
  if (cachedStages) {
    const existing = cachedStages.findIndex((item) => item.id === saved.id);
    collectionCache.fumigationStages = existing >= 0 ? cachedStages.with(existing, saved) : [saved, ...cachedStages];
  }
  const cachedPublicStages = collectionCache.publicStages;
  if (cachedPublicStages) {
    const publicPayload = toPublicStage(saved);
    const existing = cachedPublicStages.findIndex((item) => item.id === publicPayload.id);
    collectionCache.publicStages = existing >= 0 ? cachedPublicStages.with(existing, publicPayload) : [publicPayload, ...cachedPublicStages];
  }
  return saved;
}

export async function updateStageStatus(id: string, status: FumigationStage["status"]) {
  const stage = await getStage(id);
  if (!stage) return null;
  return saveStage({ ...stage, status });
}

export async function createNotification(stage: FumigationStage) {
  const notification: Omit<Notification, "id"> = {
    stageId: stage.id,
    code: stage.code,
    clientName: stage.clientName,
    channel: "whatsapp",
    status: "enviado",
    createdAt: todayIso(),
  };
  if (!isFirebaseConfigured || !db) {
    const rows = readLocal("notifications");
    writeLocal("notifications", [{ id: crypto.randomUUID(), ...notification }, ...rows]);
    return;
  }
  await addDoc(collection(db, "notifications"), {
    ...notification,
    createdAt: serverTimestamp(),
  });
}

export async function getSettings(): Promise<Settings> {
  if (!isFirebaseConfigured || !db) return seedSettings;
  try {
    const snap = await getDoc(doc(db, "settings", "main"));
    return snap.exists() ? ({ id: "main", ...snap.data() } as Settings) : seedSettings;
  } catch (error) {
    if (shouldUseLocalFallback(error)) return seedSettings;
    throw error;
  }
}

export function quickClientFromName(name: string, phone: string): Omit<Client, "id"> {
  const parts = name.trim().split(/\s+/);
  return {
    nombres: parts.slice(0, -1).join(" ") || name,
    apellidos: parts.at(-1) || "",
    telefono: phone,
    whatsapp: phone,
    direccion: "",
    sector: "",
    estado: "activo",
    createdAt: todayIso(),
    updatedAt: todayIso(),
  };
}

export function clientDisplayName(client: Client) {
  return fullName(client.nombres, client.apellidos);
}
