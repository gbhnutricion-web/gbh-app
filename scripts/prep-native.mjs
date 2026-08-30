/**
 * prep-native.mjs — parches sobre los proyectos nativos que `cap add` genera.
 *
 * POR QUÉ EXISTE: `android/` e `ios/` NO se versionan (ver .gitignore). Se
 * regeneran en cada build de CI, así que todo lo que Capacitor no sabe poner
 * por su cuenta se aplica aquí, de forma IDEMPOTENTE y en un solo sitio.
 *
 * Se ejecuta DESPUÉS de `cap add` y ANTES de `cap sync`.
 *
 * Uso:  node scripts/prep-native.mjs
 * Env:  BUILD_NUMBER  (entero incremental; Codemagic lo pasa como
 *       PROJECT_BUILD_NUMBER — el codemagic.yaml lo reexporta)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

const VERSION_NAME = pkg.version;                       // 1.0.0
const BUILD_NUMBER = String(parseInt(process.env.BUILD_NUMBER || "1", 10));

// Google Play exige API 36 (Android 16) para apps NUEVAS desde el 31-ago-2026.
// Fuente: support.google.com/googleplay/android-developer/answer/11926878
const TARGET_SDK = 36;
const COMPILE_SDK = 36;
const MIN_SDK = 23;

const log = (m) => console.log(`[prep-native] ${m}`);
const cambios = [];

function editar(ruta, fn) {
  if (!existsSync(ruta)) return false;
  const antes = readFileSync(ruta, "utf8");
  const despues = fn(antes);
  if (despues !== antes) { writeFileSync(ruta, despues, "utf8"); cambios.push(ruta); }
  return true;
}

/* ── ANDROID ──────────────────────────────────────────────────────────── */
const ANDROID = join(ROOT, "android");
if (existsSync(ANDROID)) {
  log("proyecto android detectado");

  // 1) Niveles de API. Se reescribe el valor exista o no el default de Capacitor.
  editar(join(ANDROID, "variables.gradle"), (t) => {
    let out = t;
    const fijar = (clave, valor) => {
      const re = new RegExp(`(${clave}\s*=\s*)\d+`);
      if (re.test(out)) out = out.replace(re, `$1${valor}`);
      else out = out.replace(/ext\s*\{/, `ext {\n    ${clave} = ${valor}`);
    };
    fijar("minSdkVersion", MIN_SDK);
    fijar("compileSdkVersion", COMPILE_SDK);
    fijar("targetSdkVersion", TARGET_SDK);
    return out;
  }) || log("AVISO: no hay android/variables.gradle");

  // 2) Versión y número de build. Play rechaza un versionCode repetido.
  editar(join(ANDROID, "app", "build.gradle"), (t) =>
    t.replace(/versionCode\s+\d+/, `versionCode ${BUILD_NUMBER}`)
     .replace(/versionName\s+"[^"]*"/, `versionName "${VERSION_NAME}"`)
  );

  // 3) Nada de tráfico en claro: todo va por HTTPS (Supabase, Stripe, Railway).
  editar(join(ANDROID, "app", "src", "main", "AndroidManifest.xml"), (t) =>
    t.includes("usesCleartextTraffic")
      ? t.replace(/android:usesCleartextTraffic="true"/g, 'android:usesCleartextTraffic="false"')
      : t.replace(/(<application\b)/, '$1\n        android:usesCleartextTraffic="false"')
  );
}

/* ── iOS ──────────────────────────────────────────────────────────────── */
const PLIST = join(ROOT, "ios", "App", "App", "Info.plist");
if (existsSync(PLIST)) {
  log("proyecto ios detectado");

  // Claves que Capacitor NO pone y sin las cuales Apple rechaza o la app casca:
  //  - las dos NS*UsageDescription: el <input type="file" accept="image/*"> de
  //    la foto de perfil abre la cámara/carrete; sin el texto, iOS mata el proceso.
  //  - ITSAppUsesNonExemptEncryption=false: evita la pregunta de cumplimiento
  //    de exportación en CADA subida a TestFlight (la app solo usa HTTPS).
  const CLAVES = {
    CFBundleDisplayName: "GBH Nutrición",
    CFBundleShortVersionString: VERSION_NAME,
    CFBundleVersion: BUILD_NUMBER,
    NSCameraUsageDescription:
      "GBH usa la cámara solo si eliges hacerte una foto de perfil. La imagen se queda en tu cuenta y no se comparte.",
    NSPhotoLibraryUsageDescription:
      "GBH accede a tus fotos solo cuando eliges una como foto de perfil.",
    NSPhotoLibraryAddUsageDescription:
      "GBH guarda en tu carrete las imágenes que decides descargar desde la app.",
  };

  editar(PLIST, (t) => {
    let out = t;
    for (const [k, v] of Object.entries(CLAVES)) {
      const re = new RegExp(`(<key>${k}</key>\s*<string>)[^<]*(</string>)`);
      if (re.test(out)) out = out.replace(re, `$1${v}$2`);
      else out = out.replace(/\n<\/dict>\n<\/plist>/, `\n\t<key>${k}</key>\n\t<string>${v}</string>\n</dict>\n</plist>`);
    }
    if (!out.includes("ITSAppUsesNonExemptEncryption")) {
      out = out.replace(/\n<\/dict>\n<\/plist>/, "\n\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>\n</dict>\n</plist>");
    }
    return out;
  });
}

if (!existsSync(ANDROID) && !existsSync(PLIST)) {
  console.error("[prep-native] ERROR: no hay ni android/ ni ios/. ¿Falta `npx cap add`?");
  process.exit(1);
}

log(`version ${VERSION_NAME} (build ${BUILD_NUMBER})`);
log(cambios.length ? `ficheros tocados:\n  - ${cambios.join("\n  - ")}` : "nada que cambiar (ya estaba puesto)");
