# NutriLog

Aplicación de alimentación en español con React, TypeScript y Vite. Incluye Supabase Auth real, navegación adaptable y un dashboard con datos ficticios identificados como demostración.

## Ejecutar

Requiere Node.js 24 y npm (ver `.nvmrc`).

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run lint
npm test
npm run preview
```

`build` comprueba TypeScript antes de generar `dist/`.

Para habilitar el acceso, copia `.env.example` a `.env.local`, configura tu URL y clave publicable de Supabase y reinicia Vite. Si faltan credenciales, la app muestra **Configuración pendiente** y bloquea las rutas privadas. Consulta [la configuración de Supabase, correo y Google](docs/auth-setup.md), que separa desarrollo y producción, detalla callbacks y URLs permitidas y contiene la validación manual.

```sh
npx playwright install chromium
npm run test:e2e
```

Las pruebas de navegador usan servidores y respuestas aisladas, sin llamar a cuentas reales ni simular accesos en la aplicación.

Tailwind CSS 4 utiliza `@tailwindcss/vite` en `vite.config.ts` y `@import "tailwindcss"` en `src/index.css`, según la [documentación oficial](https://tailwindcss.com/docs/installation/using-vite). No utiliza configuración ni directivas de Tailwind 3.

## Organización

- `src/app`: aplicación, rutas, navegación y efectos de cambio de ruta.
- `src/components`: botones, campos etiquetados, tarjetas, mensajes, estados vacíos y logo.
- `src/layouts`: estructura compartida de autenticación y aplicación.
- `src/features/auth`: proveedor y hook de sesión, protección de rutas, acceso, registro con confirmación, Google, recuperación, actualización y callbacks PKCE.
- `src/features/dashboard`: dashboard interactivo, fixtures separados, cálculos y paneles.
- `src/features/meals`: pantalla inicial de calorías y alimentos.
- `src/features/statistics`: pantalla inicial de estadísticas.
- `src/features/settings`: pantalla inicial de configuración.
- `src/lib`: cliente Supabase centralizado, validación de configuración y utilidades de fecha.
- `src/types`: tipos compartidos de navegación.

La carpeta `supabase/` se incorporará con la primera migración o función real. No se crean carpetas vacías ni clientes sin uso.

## Rutas

| Ruta               | Pantalla                |
| ------------------ | ----------------------- |
| `/login`           | Iniciar sesión          |
| `/register`        | Crear cuenta            |
| `/forgot-password` | Solicitar recuperación  |
| `/update-password` | Actualizar contraseña   |
| `/auth/callback`   | Confirmación de acceso  |
| `/dashboard`       | Resumen diario          |
| `/calories`        | Calculadora de calorías |
| `/statistics`      | Gráficas y estadísticas |
| `/settings`        | Configuración           |

`/` redirige a `/dashboard`. Dashboard, calorías, estadísticas, configuración y actualización de contraseña requieren una sesión verificada. Login y registro redirigen al dashboard si ya hay sesión. Se espera la restauración inicial antes de decidir la redirección, sin mostrar contenido privado brevemente. Las direcciones desconocidas muestran una página con enlace de regreso. El alojamiento de producción debe devolver `index.html` para las rutas de la SPA, incluidos accesos directos y recargas. Vite ofrece este comportamiento en desarrollo y preview.

## Estado de las funciones

La navegación y los enlaces funcionan. El menú móvil se abre con un botón etiquetado, comunica su estado mediante `aria-expanded` y se cierra con Escape o al elegir una ruta. Incluye navegación nativa por teclado, foco visible, salto al contenido y foco en el contenido al cambiar de pantalla.

El dashboard usa una semana fija del 5 al 11 de octubre de 2026. El “hoy” simulado es el domingo 11 y está indicado en pantalla; no representa la fecha real. La selección inicial es el jueves 8. Los siete botones actualizan fecha, métricas, estado, macros, comidas, selección del gráfico y contexto del análisis. La semana incluye días dentro del objetivo, por encima, por debajo, en curso y sin registros.

El rango de demostración es 2.000–2.300 kcal. Los totales se derivan de los macros de las comidas mediante 4 kcal/g de proteínas y carbohidratos y 9 kcal/g de grasas. Son ejemplos de interfaz, no datos de una fuente nutricional ni recomendaciones. El promedio usa cinco días completos con registros (2.110,2 kcal, redondeado a 2.110 en pantalla); tres están en objetivo. Excluye días sin registros y en curso. Los límites del rango son inclusivos. La diferencia compara con el mínimo si falta para entrar al rango y con el máximo si se supera; distingue días parciales y días sin datos.

El gráfico incluye unidades kcal/día, banda objetivo, leyenda, tooltip y valores textuales desplegables. La barra rayada representa un registro parcial. La distribución energética se calcula desde los macros. “Usar ejemplo” y “Analizar · Demo” operan solo en memoria: únicamente reconocen el ejemplo fijo de arroz y huevos y muestran un resultado ficticio, sin agregar comidas ni guardar datos. Cambiar de fecha limpia el análisis. `npm test` verifica consistencia de fixtures, estados, promedio, diferencias y límites.

La autenticación usa exclusivamente Supabase Auth. Incluye sesión persistente, renovación, correo y Google, confirmación y reenvío, recuperación y actualización. Las contraseñas se pasan solo al SDK y se limpian del formulario; no se almacenan en tablas, metadata, logs ni localStorage. Al cerrar sesión o cambiar de cuenta se desmonta el contenido privado y se descarta su estado en memoria. Si falla la comprobación de sesión o el cierre, se ocultan los datos y se muestra un error con opción de reintentar.

Pendiente de configuración externa: URL y clave publicable reales, correo/SMTP, URLs permitidas y proveedor Google. No se ha validado el envío de correos ni OAuth contra un proyecto real sin esas credenciales. Pendiente de implementación: edición y persistencia del perfil, preferencias y objetivos; fuente real de alimentos, análisis de texto, porciones, cálculo nutricional real, guardado de comidas y estadísticas conectadas.

## Variables de entorno

`.env.example` contiene ejemplos sin secretos de `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `VITE_GOOGLE_AUTH_ENABLED`. Los valores de ejemplo mantienen el estado pendiente. Usa `.env.local` para configurar tu entorno de desarrollo; habilita el flag de Google solo después de configurar el proveedor en Supabase y el cliente OAuth en Google Cloud.

Solo se acepta una clave publicable del cliente. Nunca colocar claves secretas, secretos OAuth ni `service_role` en variables `VITE_*`: Vite las expone al navegador. `.env` y sus variantes están ignorados por Git, salvo `.env.example`. Los futuros datos en Supabase necesitarán políticas RLS; la protección de rutas de React no reemplaza permisos del backend.
