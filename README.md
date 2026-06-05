# AGRICOLA PIMAMPIRO

Sistema web para control, registro y seguimiento de fumigaciones agricolas con Next.js, Firebase, Tailwind CSS, Shadcn-style UI, React Hook Form y Zod.

## Inicio rapido

1. Copia `.env.example` a `.env.local` y agrega la configuracion de Firebase.
2. Instala dependencias con `npm install`.
3. Ejecuta `npm run dev`.

Si no configuras Firebase, la app usa almacenamiento local del navegador con datos semilla para poder probar la experiencia.

Con Firebase configurado, crea primero un usuario en Firebase Auth y agrega en Firestore el documento `users/{uid}` con:

```json
{
  "nombre": "Administrador",
  "email": "admin@agricolapimampiro.com",
  "rol": "admin",
  "telefono": "09XXXXXXXX",
  "estado": "activo"
}
```

## Colecciones Firestore

- `users`
- `clients`
- `crops`
- `pests`
- `products`
- `sites`
- `fumigationStages`
- `publicStages`
- `notifications`
- `settings`

## Reglas

El archivo `firestore.rules` incluye una base de seguridad por roles. La consulta publica usa `publicStages`, una copia sin productos, cantidades, dosis, receta ni observaciones internas.
