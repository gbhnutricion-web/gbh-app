# Publicar GBH en Google Play y App Store

Cómo se construyen y se suben las dos apps. **Nada de esto se dispara solo.**

## La idea en una frase

La app **no se reescribe**: la misma PWA de `app.gbhnutricion.es` se empaqueta con
**Capacitor** dentro de un contenedor nativo, con los ficheros web **dentro del
paquete** (no cargando una URL remota). Eso importa por dos motivos: Apple rechaza
por la directriz 4.2 lo que es solo un navegador apuntando a una web, y una app
con los ficheros dentro **abre aunque Vercel esté caído**.

El contenido (recetas, programaciones, planes) sigue viniendo de Supabase en
tiempo real, así que **cambiar contenido no exige publicar versión nueva**. Solo
la exige cambiar la interfaz.

## Por qué la fábrica está en la nube

Compilar para iOS exige macOS y Xcode. El PC es Windows y no tiene Node ni Java.
`codemagic.yaml` construye las dos apps en máquinas alquiladas: funciona igual
desde Pamplona que desde fuera de España, y no depende de que un ordenador
concreto esté encendido. Plan gratuito: 500 minutos de macOS al mes (~40 builds).

## Qué está en el repositorio y qué no

| | |
|---|---|
| `capacitor.config.json` | identidad de la app: `es.gbhnutricion.app`, nombre, colores, splash |
| `codemagic.yaml` | las dos recetas de build (`android`, `ios`) |
| `scripts/prep-native.mjs` | **todos** los parches nativos, en un solo sitio |
| `resources/` | icono 1024 y splash 2732 de los que se derivan todos los tamaños |
| `android/` `ios/` | **NO están, a propósito** — se generan en cada build |

Los proyectos nativos no se versionan para que no haya dos verdades. Si algún día
hace falta configuración nativa nueva, va en `prep-native.mjs`, no a mano.

## El orden de los pasos en cada build

```
npm ci → vite build → cap add <plataforma> → prep-native.mjs
       → capacitor-assets generate → cap sync → compilar
```

`prep-native.mjs` va **antes** de `cap sync` porque toca `variables.gradle` y el
`Info.plist`, y `sync` es quien los lee.

## Lo que hay que dar de alta una vez (y solo puede hacerlo Alejandro)

1. **Cuenta de Google Play** — 25 $ una vez. Verificación de identidad.
2. **Apple Developer Program** — 99 €/año. Como *individual*: el vendedor que
   aparece en la ficha es su nombre legal (una empresa exige D-U-N-S, correo en
   dominio propio y semanas de espera).
3. **En Codemagic:** almacén de firma de Android, clave de API de App Store
   Connect y cuenta de servicio de Google Play. Se suben ahí, no aquí.

## Comprobaciones que el build hace por su cuenta y tumban la compilación

- `targetSdkVersion = 36` en Android. Google Play **rechaza apps nuevas** con un
  objetivo menor desde el **31-ago-2026**.
- `NSCameraUsageDescription` y `NSPhotoLibraryUsageDescription` en el `Info.plist`.
  La foto de perfil abre la cámara: sin esos textos, **iOS mata la app** en vez de
  dar un error.
- `ITSAppUsesNonExemptEncryption = false`: evita la pregunta de cumplimiento de
  exportación en cada subida a TestFlight.

## Lo que NO lleva la versión 1 y hay que saberlo

- **Sin notificaciones push.** Exige Firebase y un certificado APNs; se deja para
  la v2 para no bloquear el lanzamiento. *Es el único argumento fuerte a favor de
  las tiendas, así que no se olvida: se aplaza.*
- **`navigator.share` no existe en el WebView de Android.** Compartir seguirá
  funcionando en iOS y en la web, y en Android nativo caerá al plan B que ya tiene
  el código. Se arregla con `@capacitor/share` cuando se toque el código.
- **`navigator.vibrate` no existe en iOS.** La háptica seguirá muda ahí hasta que
  se cambie por `@capacitor/haptics`.
- **En iOS nativo no hay checkout ni tarifas.** Ya está resuelto en el código con
  `ES_IOS_NATIVO` (directriz 3.1.1 de Apple). Quien quiera pasar a estándar lo
  hace desde la web.

## Vuelta atrás

Todo esto vive en la rama `tiendas`. `main` está intacto y Vercel sigue
desplegando desde `main`. Deshacer = borrar la rama.
