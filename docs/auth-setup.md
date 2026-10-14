# Configurar Supabase Auth en NutriLog

El código usa Supabase Auth real. Sin credenciales válidas, muestra **Configuración pendiente**, deshabilita los formularios y bloquea todas las rutas privadas. No existe acceso de demostración ni un bypass de autenticación. El contenido nutricional del dashboard sigue siendo ficticio después de iniciar sesión.

## 1. Proyecto y variables

1. Crea un proyecto de desarrollo en Supabase. Usa un proyecto distinto para producción.
2. En los ajustes del proyecto, copia la **Project URL** y la clave **publishable** (`sb_publishable_…`). Esta implementación requiere la clave publicable nueva; no acepta claves JWT heredadas ni claves secretas.
3. Copia `.env.example` a `.env.local` y reemplaza los ejemplos:

```dotenv
VITE_SUPABASE_URL=https://ID_DEL_PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_CLAVE_PUBLICABLE_DEL_PROYECTO
VITE_GOOGLE_AUTH_ENABLED=false
```

4. Reinicia `npm run dev`. En producción configura estas variables en el alojamiento y vuelve a compilar: Vite las incluye en el bundle.

`.env.local`, otras variantes de `.env`, `.secrets/` y descargas `client_secret*.json` / `oauth-client*.json` están excluidos de Git. No pegues secretos en el chat, el código o variables `VITE_*`. No se necesita una clave `service_role`, una clave `sb_secret_*` ni un secreto OAuth en el frontend.

## 2. Correo y URLs de retorno

En **Authentication → Sign In / Providers → Email**, habilita Email y la confirmación de correo. Configura una política de contraseñas de al menos 8 caracteres; el servidor aplica cualquier condición adicional. Para envío fiable configura SMTP propio; el servicio de correo de prueba tiene restricciones y límites. Consulta [acceso por contraseña](https://supabase.com/docs/guides/auth/passwords).

En **Authentication → URL Configuration**, usa:

| Entorno                          | Site URL                         | Redirect URLs permitidas                                                                          |
| -------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| Desarrollo, localhost            | `http://localhost:5173`          | `http://localhost:5173/auth/callback` y `http://localhost:5173/auth/callback?*`                   |
| Desarrollo, IP local (si se usa) | `http://127.0.0.1:5173`          | `http://127.0.0.1:5173/auth/callback` y `http://127.0.0.1:5173/auth/callback?*`                   |
| Producción, ejemplo a reemplazar | `https://nutrilog.tu-dominio.cl` | `https://nutrilog.tu-dominio.cl/auth/callback` y `https://nutrilog.tu-dominio.cl/auth/callback?*` |

Solo hay un Site URL por proyecto: elige el origen de desarrollo que utilices. En el proyecto de producción usa exclusivamente el dominio HTTPS real. Si usas otro puerto en desarrollo, registra ese origen por separado. El wildcard se limita a los parámetros de **esa ruta**: la recuperación añade `flow=recovery`, y el SDK puede añadir `sb_flow_id` para seleccionar el verificador PKCE. No uses `/**` en producción ni autorices dominios ajenos. La app construye el retorno desde su origen actual y siempre apunta a `/auth/callback`; no acepta un `next` externo. Más información sobre [URLs permitidas](https://supabase.com/docs/guides/auth/redirect-urls).

Conserva en las plantillas **Confirm signup** y **Reset password** el enlace de verificación de Supabase:

```html
<a href="{{ .ConfirmationURL }}">Continuar en NutriLog</a>
```

No lo reemplaces por `SiteURL`, un enlace directo al dashboard ni un enlace con tokens en el fragmento. `ConfirmationURL` verifica el correo en Supabase y retorna al `redirectTo` solicitado. Esta app espera un **código PKCE**, no implementa flujo implícito ni plantillas personalizadas de `token_hash`. Consulta las [plantillas de correo](https://supabase.com/docs/guides/auth/auth-email-templates).

Para registrarte, envía correo, contraseña y confirmación. Si Supabase no devuelve sesión, la app pide revisar el correo y permite reenviar la confirmación. Los mensajes no garantizan que se haya creado una cuenta para un correo ya registrado, ni revelan la existencia de cuentas en la recuperación. Abre los enlaces de confirmación y recuperación en el **mismo navegador y origen** desde el que se solicitaron. PKCE necesita el verificador que conserva el SDK; cambiar de navegador, alternar localhost con 127.0.0.1, consumir el enlace dos veces o dejarlo vencer requiere un nuevo enlace. Consulta el [flujo PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow).

## 3. Google Cloud y Supabase

El flujo es: **app → Supabase → Google → callback de Supabase → `/auth/callback` de la app → intercambio PKCE**. Google no retorna directamente a la ruta de React.

1. En Google Cloud / Google Auth Platform configura el proyecto, Branding, Audience y Data Access. En modo Testing agrega tus usuarios de prueba.
2. Autoriza solo `openid`, `userinfo.email` y `userinfo.profile`. No agregues Gmail, contactos, Drive ni calendario. El botón solicita `openid email profile`; no solicita acceso offline.
3. Crea un cliente OAuth de tipo **Web application** para desarrollo y otro para producción.
4. En **Authorized JavaScript origins** del cliente de desarrollo agrega `http://localhost:5173` y/o `http://127.0.0.1:5173`. En producción agrega únicamente tu origen HTTPS real.
5. En **Authorized redirect URIs** agrega el callback que muestra Supabase en el proveedor Google: `https://ID_DEL_PROYECTO.supabase.co/auth/v1/callback`. Usa el proyecto de desarrollo o producción correspondiente. Si Supabase tiene un dominio personalizado, copia su callback exacto. No pongas `/auth/callback` de NutriLog en este campo.
6. En **Authentication → Sign In / Providers → Google** de Supabase habilita Google y guarda allí el Client ID y Client Secret. El secreto permanece en Supabase, nunca en el frontend.
7. Verifica las URLs de retorno de la sección anterior y establece `VITE_GOOGLE_AUTH_ENABLED=true` en el entorno correspondiente. Reinicia o recompila. Este flag solo activa el botón: no configura el proveedor ni reemplaza las comprobaciones reales.

Sigue la [guía oficial de Google en Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google). No necesitas las API de Gmail, Drive o Calendar. La aplicación no copia ni usa tokens de Google para acceder a otros servicios.

## 4. Sesiones y datos del usuario

`src/lib/supabase.ts` crea un único cliente, con persistencia, renovación automática y PKCE. El SDK gestiona el almacenamiento de la sesión y los verificadores; la app no crea tokens, tablas de contraseñas ni un almacenamiento paralelo. Las contraseñas solo se pasan a métodos Auth y se limpian del formulario después del envío. No se incluyen en metadata ni en logs.

`AuthProvider` observa los cambios de sesión, restaura la sesión y comprueba la identidad con `getUser` antes de montar rutas privadas. Los resultados de solicitudes antiguas se descartan cuando cambia la sesión. `useAuth` permite acceder al usuario, estado y cierre de sesión. Login y registro redirigen al dashboard si ya hay sesión; callbacks y recuperación siguen disponibles para gestionar los enlaces.

Al cerrar sesión se desmonta inmediatamente todo el árbol privado, incluyendo sus estados de formulario, selección y datos en memoria. El cierre usa `signOut({ scope: 'local' })`: termina la sesión actual y se propaga a las pestañas del mismo navegador. Si falla, la app mantiene oculto el contenido privado, muestra el error y permite reintentar; no afirma que el cierre haya tenido éxito. Al cambiar de identidad también se desmonta el árbol anterior antes de verificar la nueva cuenta. Actualmente no hay cachés de consultas ni datos de usuario guardados por la app fuera del SDK. Si se incorpora una caché persistente, deberá limpiarse junto con este cambio de identidad.

La protección de React controla la interfaz. Al incorporar tablas se deberán crear políticas RLS basadas en `auth.uid()`; estas rutas no sustituyen la autorización del backend. No hacen falta migraciones ni tablas de contraseñas para Supabase Auth.

## 5. Validación

```sh
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Las pruebas E2E lanzan servidores aislados en los puertos 5176 y 5177. Usan un dominio `.test` y respuestas interceptadas exclusivamente en los tests; no llaman a proyectos reales ni agregan un login simulado a la app. Cubren registro y confirmación, login, persistencia al recargar, protección sin sesión y sin parpadeo, recuperación, actualización, enlaces vencidos, OAuth PKCE y scopes de Google, limpieza entre cuentas y fallo de cierre de sesión. No sustituyen una validación con credenciales reales.

Para validar el servicio configurado:

1. Registra una cuenta de prueba y confirma el correo en el mismo navegador. Antes de confirmarlo, verifica el mensaje de correo pendiente y el reenvío.
2. Inicia sesión, abre `/settings` y recarga: debe conservarse la sesión y mostrarse el correo correcto. Abre `/login`: debe redirigir a `/dashboard`.
3. En una ventana sin sesión, abre `/dashboard`, `/calories`, `/statistics`, `/settings` y `/update-password`: ninguna debe mostrar contenido privado.
4. Solicita recuperación, abre el enlace, cambia la contraseña con confirmación y comprueba el acceso con la nueva contraseña. Reutiliza el enlace: debe mostrar un error y permitir solicitar otro.
5. Cuando Google esté configurado, pulsa “Continuar con Google”, revisa únicamente los permisos de identidad y confirma el retorno al dashboard. Prueba también cancelar el consentimiento.
6. Cierra sesión después de cambiar la fecha y escribir una comida. Comprueba que desaparecen el dashboard y el correo; entra con otra cuenta y verifica que no se conservan el texto ni la selección anteriores. Comprueba también el cierre en otra pestaña.

**Estado de esta entrega:** sin `.env.local` ni proyectos/OAuth configurados no se puede verificar un registro, envío de correo o consentimiento de Google contra servicios reales. El estado pendiente es intencional hasta completar la configuración anterior.
