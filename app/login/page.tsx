"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/components/auth-provider";
import { CompanyLogo } from "@/components/company-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(4, "Ingrese clave"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "adminagricola@gmail.com",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    try {
      await login(values.email, values.password);
      router.push("/dashboard");
    } catch (error) {
      setError("email", { message: error instanceof Error ? error.message : "No se pudo iniciar sesion" });
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <CompanyLogo className="mb-4 justify-center" imageClassName="h-28 max-w-full" />
          <h1 className="text-3xl font-black text-emerald-950">AGRICOLA PIMAMPIRO</h1>
          <p className="mt-2 text-sm text-muted-foreground">Control tecnico de fumigaciones agricolas</p>
        </div>

        <Card>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
              <Field label="Correo" error={errors.email?.message}>
                <Input type="email" autoComplete="email" {...register("email")} />
              </Field>
              <Field label="Clave" error={errors.password?.message}>
                <Input type="password" autoComplete="current-password" {...register("password")} />
              </Field>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                <LogIn className="h-5 w-5" />
                Iniciar sesion
              </Button>
            </form>
            <p className="mt-4 rounded-md bg-emerald-50 p-3 text-xs text-emerald-900">
              Con Firebase activo, usa el correo y la clave creados en Authentication. La clave debe coincidir exactamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
