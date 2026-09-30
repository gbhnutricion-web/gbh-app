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
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
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
// 26 desde el 30-sep-2026: Health Connect (@capgo/capacitor-health) lo exige. Medido ese día en los
// registros del gateway: la app de tienda solo corre en Android 14 y 15 (BRIEF_pasos.md §0).
const MIN_SDK = 26;

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
      // \\s y \\d DOBLES: dentro de una plantilla `…`, «\s» vale «s» y la expresión no casaba nunca (hasta el
      // 30-sep-2026 se añadía otra línea encima y Gradle se quedaba con la de la plantilla, la última).
      const re = new RegExp(`(${clave}\\s*=\\s*)\\d+`);
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

  // 2b) Firma de release con el keystore que inyecta Codemagic (android_signing).
  // Sin signingConfig, bundleRelease produce un AAB SIN FIRMAR que Play rechaza.
  // Idempotente: no vuelve a insertarlo si ya está.
  editar(join(ANDROID, "app", "build.gradle"), (t) => {
    if (t.includes("cmSigning")) return t;
    const bloque = `
    // cmSigning — inyectado por scripts/prep-native.mjs
    signingConfigs {
        release {
            if (System.getenv("CM_KEYSTORE_PATH")) {
                storeFile file(System.getenv("CM_KEYSTORE_PATH"))
                storePassword System.getenv("CM_KEYSTORE_PASSWORD")
                keyAlias System.getenv("CM_KEY_ALIAS")
                keyPassword System.getenv("CM_KEY_PASSWORD")
            }
        }
    }
`;
    let out = t.replace(/(android\s*\{)/, `$1${bloque}`);
    out = out.replace(/(buildTypes\s*\{\s*release\s*\{)/,
      `$1
            signingConfig signingConfigs.release`);
    return out;
  });

  // 3) Nada de tráfico en claro: todo va por HTTPS (Supabase, Stripe, Railway).
  editar(join(ANDROID, "app", "src", "main", "AndroidManifest.xml"), (t) =>
    t.includes("usesCleartextTraffic")
      ? t.replace(/android:usesCleartextTraffic="true"/g, 'android:usesCleartextTraffic="false"')
      : t.replace(/(<application\b)/, '$1\n        android:usesCleartextTraffic="false"')
  );

  // 4) Avisos fuera de la app (28-sep-2026, 07. App GBH/BRIEF_notificaciones.md §4.3).
  //  a) SIN alarmas exactas. @capacitor/local-notifications declara SCHEDULE_EXACT_ALARM en
  //     su manifiesto y, con isExactNotification a true (su valor por defecto), schedule()
  //     abriría en Android 12+ la pantalla «Alarmas y recordatorios». La app programa con
  //     isExactNotification:false (src/avisosNativos.js) y aquí se quita el permiso del
  //     manifiesto final: Play restringe USE_EXACT_ALARM a apps de alarma y calendario, y
  //     SCHEDULE_EXACT_ALARM viene denegado por defecto en Android 14. codemagic.yaml lo comprueba.
  editar(join(ANDROID, "app", "src", "main", "AndroidManifest.xml"), (t) => {
    let out = t;
    if (!/xmlns:tools=/.test(out)) out = out.replace(/<manifest\b/, '<manifest xmlns:tools="http://schemas.android.com/tools"');
    if (!out.includes("SCHEDULE_EXACT_ALARM")) {
      out = out.replace(/<\/manifest>\s*$/,
        '    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" tools:node="remove" />\n</manifest>\n');
    }
    return out;
  });
  //  b) El icono pequeño de la barra de estado (capacitor.config.json → LocalNotifications.smallIcon):
  //     blanco sobre transparente. Sin él, Android pinta una «i» genérica del sistema.
  //     Es la campana de Material Icons («notifications», licencia Apache 2.0).
  const DRAWABLE = join(ANDROID, "app", "src", "main", "res", "drawable");
  if (!existsSync(DRAWABLE)) mkdirSync(DRAWABLE, { recursive: true });
  const ICONO = join(DRAWABLE, "ic_stat_gbh.xml");
  const icono = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp"
    android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF"
        android:pathData="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.89,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"/>
</vector>
`;
  if (!existsSync(ICONO) || readFileSync(ICONO, "utf8") !== icono) { writeFileSync(ICONO, icono, "utf8"); cambios.push(ICONO); }

  // 5) Pasos del móvil (30-sep-2026, 07. App GBH/BRIEF_pasos.md).
  //  a) Health Connect: SOLO READ_STEPS. @capgo/capacitor-health declara en su manifiesto los
  //     permisos de leer y escribir de todo (47 en la 8.11.4), y Play exige justificar cada uno en
  //     la declaración de apps de salud: se quitan todos menos READ_STEPS con tools:node="remove".
  //     La lista se lee del manifiesto del complemento INSTALADO, así que si otra versión añade
  //     permisos también se quitan. codemagic.yaml lo comprueba en el manifiesto fusionado.
  //     ACTIVITY_RECOGNITION (el sensor de pasos en vivo) lo declara @capgo/capacitor-pedometer.
  const HC_MANIFEST = join(ROOT, "node_modules", "@capgo", "capacitor-health", "android", "src", "main", "AndroidManifest.xml");
  const HC_PERMISOS = existsSync(HC_MANIFEST)
    ? [...new Set([...readFileSync(HC_MANIFEST, "utf8").matchAll(/android\.permission\.health\.[A-Z_]+/g)].map((m) => m[0]))]
    : [];
  if (!HC_PERMISOS.length) log("AVISO: no encuentro el manifiesto de @capgo/capacitor-health; no se quita ningún permiso");
  editar(join(ANDROID, "app", "src", "main", "AndroidManifest.xml"), (t) => {
    let out = t;
    if (!/xmlns:tools=/.test(out)) out = out.replace(/<manifest\b/, '<manifest xmlns:tools="http://schemas.android.com/tools"');
    for (const p of HC_PERMISOS) {
      if (p === "android.permission.health.READ_STEPS" || out.includes(`"${p}" tools:node="remove"`)) continue;
      out = out.replace(/<\/manifest>\s*$/, `    <uses-permission android:name="${p}" tools:node="remove" />\n</manifest>\n`);
    }
    return out;
  });
  //  b) La política de privacidad que enseña Health Connect al pulsar «por qué pide esto» (la
  //     PermissionsRationaleActivity del complemento lee este recurso): la MISMA URL que la ficha
  //     de Play (FICHA_TIENDAS.md), que es lo que Google exige.
  editar(join(ANDROID, "app", "src", "main", "res", "values", "strings.xml"), (t) =>
    t.includes('name="health_connect_privacy_policy_url"') ? t
      : t.replace(/<\/resources>/, '    <string name="health_connect_privacy_policy_url">https://app.gbhnutricion.es/legal/</string>\n</resources>')
  ) || log("AVISO: no hay android/app/src/main/res/values/strings.xml");
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
    // Pasos del móvil (30-sep-2026): el podómetro de CoreMotion (@capgo/capacitor-pedometer). Sin
    // esta clave iOS mata la app al leer los pasos. Es el texto del permiso «Movimiento y forma física».
    NSMotionUsageDescription:
      "GBH lee los pasos que cuenta tu iPhone para apuntarlos solos en tu misión diaria de 10.000 pasos. Solo el número de pasos, sin compartirlo con terceros.",
  };

  editar(PLIST, (t) => {
    let out = t;
    for (const [k, v] of Object.entries(CLAVES)) {
      // \\s DOBLE (ver fijar, arriba): sin él la clave se añadía repetida en vez de sustituirse.
      const re = new RegExp(`(<key>${k}</key>\\s*<string>)[^<]*(</string>)`);
      if (re.test(out)) out = out.replace(re, `$1${v}$2`);
      else out = out.replace(/\n<\/dict>\n<\/plist>/, `\n\t<key>${k}</key>\n\t<string>${v}</string>\n</dict>\n</plist>`);
    }
    if (!out.includes("ITSAppUsesNonExemptEncryption")) {
      out = out.replace(/\n<\/dict>\n<\/plist>/, "\n\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>\n</dict>\n</plist>");
    }
    return out;
  });

  // SOLO iPHONE. Capacitor genera el proyecto con TARGETED_DEVICE_FAMILY = "1,2"
  // (iPhone + iPad). La app es de una columna: en un iPad de 13" se ve estirada,
  // y el revisor de Apple prueba en iPad — es rechazo habitual por la 4.0. Además,
  // declarar iPad obliga a subir un juego entero de capturas de iPad a la ficha.
  // Decisión de Alejandro del 12-sep-2026 (MAESTRO-2026-520). Para revertir:
  // quitar este bloque y el paso de comprobación del codemagic.yaml.
  // Idempotente: el valor se reescribe sea cual sea el que venga.
  const PBXPROJ = join(ROOT, "ios", "App", "App.xcodeproj", "project.pbxproj");
  const antesPbx = existsSync(PBXPROJ) ? readFileSync(PBXPROJ, "utf8") : "";
  if (!antesPbx) {
    console.error("[prep-native] ERROR: no existe ios/App/App.xcodeproj/project.pbxproj");
    process.exit(1);
  }
  if (!/TARGETED_DEVICE_FAMILY\s*=/.test(antesPbx)) {
    console.error("[prep-native] ERROR: el pbxproj no declara TARGETED_DEVICE_FAMILY; " +
                  "Capacitor ha cambiado la plantilla y el binario saldria tambien para iPad");
    process.exit(1);
  }
  editar(PBXPROJ, (t) => t.replace(/TARGETED_DEVICE_FAMILY = [^;]+;/g, 'TARGETED_DEVICE_FAMILY = "1";'));
  log("iOS: TARGETED_DEVICE_FAMILY = \"1\" (solo iPhone)");
}

if (!existsSync(ANDROID) && !existsSync(PLIST)) {
  console.error("[prep-native] ERROR: no hay ni android/ ni ios/. ¿Falta `npx cap add`?");
  process.exit(1);
}

log(`version ${VERSION_NAME} (build ${BUILD_NUMBER})`);
log(cambios.length ? `ficheros tocados:\n  - ${cambios.join("\n  - ")}` : "nada que cambiar (ya estaba puesto)");
