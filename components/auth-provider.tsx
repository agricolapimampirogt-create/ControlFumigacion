"use client";

import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { clearDataCache, clearLocalAppData, getUserProfile, listUsers, saveUser } from "@/lib/data";
import type { AppUser } from "@/types";

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const currentUserKey = "agricola:current-user";
const bootstrapAdminEmails = [
  process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL,
  process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS,
  "adminagricola@gmail.com",
  "agricolapimampirogt@gmail.com",
]
  .flatMap((value) => (value || "").split(","))
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function fallbackProfile(firebaseUser: { uid: string; email: string | null; displayName: string | null }): AppUser {
  const email = firebaseUser.email || "";
  return {
    id: firebaseUser.uid,
    nombre: firebaseUser.displayName || (bootstrapAdminEmails.includes(email.toLowerCase()) ? "Admin" : email) || "Usuario",
    email,
    rol: bootstrapAdminEmails.includes(email.toLowerCase()) ? "admin" : "tecnico",
    estado: "activo",
  };
}

async function resolveFirebaseProfile(firebaseUser: { uid: string; email: string | null; displayName: string | null }) {
  const savedProfile = await getUserProfile(firebaseUser.uid);
  if (savedProfile) return savedProfile;

  const profile = fallbackProfile(firebaseUser);
  if (profile.rol !== "admin") return profile;

  try {
    return await saveUser(profile);
  } catch {
    return profile;
  }
}

function authErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Correo o clave incorrectos en Firebase Auth. Revisa la clave del usuario en Authentication.";
  }

  if (code === "auth/too-many-requests") {
    return "Firebase bloqueo temporalmente los intentos. Espera unos minutos o restablece la clave.";
  }

  if (code === "permission-denied") {
    return "Login correcto, pero Firestore no permite leer el perfil. Despliega las reglas del proyecto.";
  }

  return error instanceof Error ? error.message : "No se pudo iniciar sesion";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadLocalUser() {
      const raw = window.localStorage.getItem(currentUserKey);
      if (raw && !cancelled) setUser(JSON.parse(raw) as AppUser);
      if (!cancelled) setLoading(false);
    }

    if (!isFirebaseConfigured || !auth) {
      loadLocalUser();
      return;
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        clearDataCache();
        setUser(null);
        setLoading(false);
        return;
      }
      clearDataCache();
      const profile = await resolveFirebaseProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });
      setUser(profile);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      clearDataCache();
      if (isFirebaseConfigured && auth) {
        try {
          const credential = await signInWithEmailAndPassword(auth, email, password);
          const profile = await resolveFirebaseProfile({
            uid: credential.user.uid,
            email: credential.user.email,
            displayName: credential.user.displayName,
          });
          setUser(profile);
          return;
        } catch (error) {
          throw new Error(authErrorMessage(error));
        }
      }

      const users = await listUsers();
      const profile =
        users.find((item) => item.email.toLowerCase() === email.toLowerCase()) ||
        users.find((item) => item.rol === "admin") ||
        null;
      if (!profile) throw new Error("Usuario no encontrado");
      window.localStorage.setItem(currentUserKey, JSON.stringify(profile));
      setUser(profile);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured && auth) await firebaseSignOut(auth);
    clearLocalAppData();
    setUser(null);
    router.replace("/login");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, logout, isAdmin: user?.rol === "admin" }),
    [loading, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return value;
}
