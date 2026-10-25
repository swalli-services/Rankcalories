# Amigos y clasificacion: Paso 1

Solo se preparo la base de datos; no se modifico React ni se ejecuto SQL remoto.

## Instalacion

Para una instalacion nueva, abre `supabase/PEGAR_EN_SUPABASE.sql`, copia TODO,
y pegalo en Supabase > SQL Editor > New query > Run. Incluye amigos, avatares
y ranked en una transaccion. No es necesario conectar GitHub a la base de datos.
Ejecutar una vez como administrador. No requiere secretos en el navegador.

Si ya ejecutaste el SQL del Paso 1 anterior, ejecuta solamente
`supabase/migrations/202610250002_ranked.sql` para agregar ranked sin borrar datos.
No ejecutes el instalador y las migraciones por separado: son alternativas.
Las dos migraciones se conservan para poder versionar el esquema con Supabase CLI;
el archivo PEGAR_EN_SUPABASE es su combinacion para instalacion manual inicial.

Si ya existen `public.profiles`, `public.friendships` o el bucket `avatars`,
el script falla y revierte todo. No elimina ni reemplaza esos datos: se debe
revisar el esquema remoto y adaptar la migracion antes de repetirla.
No reutilices un bucket publico con estas reglas: sus descargas serian publicas.
Revisa tambien cualquier politica previa de `storage.objects` que conceda acceso
a todos los buckets; las politicas permisivas se combinan con OR.

## Contrato para React (etapa posterior)

- Tag: `nutri#` seguido del UUID sin guiones. Unico y sin nombre ni correo.
- Buscar: `rpc('find_profile_by_tag', { p_tag: tag })`. Devuelve id y tag.
  La busqueda es exacta tras quitar espacios externos y convertir a minusculas.
- Enviar: insertar solo `sender_id` y `receiver_id`. El estado es pending por defecto.
- Responder: actualizar solo `status` a accepted/rejected filtrando por id.
  RLS permite hacerlo unicamente al receptor y si sigue pendiente. Comprobar
  filas afectadas: una actualizacion bloqueada por RLS puede afectar cero filas.
- Solicitudes: consultar friendships filtrando receiver_id propio y status pending.
- Leaderboard: `rpc('get_friends_leaderboard')`; excluye pendientes/rechazados.
  Orden descendente por puntuacion, tag como orden estable en empates. Devuelve
  leaderboard_position con puestos compartidos (1, 1, 3), rank_name,
  rank_min_score, next_rank_score, points_to_next y rank_progress_percent.
  La posicion se calcula solo dentro del grupo de amigos del usuario actual.
- Avatar: subir a avatars como `<userId>/<crypto.randomUUID()>.webp` (o jpg/png),
  guardar esa ruta en profiles.avatar_url y obtener una URL firmada temporal para
  mostrarla. No guardar URLs firmadas ni usar getPublicUrl. Se permite acceso al
  propietario, amigos y participantes de solicitudes pendientes; las URLs ya
  firmadas siguen validas hasta caducar. Usar caducidad corta, por ejemplo 60 s.
- El perfil visible incluye solo id, tag, avatar_url y consistency_score.
  Ni comidas, calorias, objetivos ni datos de auth.users se comparten.

Una relacion por pareja evita duplicados y solicitudes cruzadas. Por ahora no
hay reenvio tras rechazo, cancelacion ni eliminacion de amistades desde cliente.
Estas operaciones no se conceden implicitamente y requeriran otro flujo explicito.

La puntuacion inicia en cero y no se calcula aun. Ningun usuario puede escribirla
desde el cliente. Para probar, un administrador puede ejecutar en SQL Editor:

```sql
update public.profiles
set consistency_score = 7
where tag = 'REEMPLAZAR_POR_TAG_REAL';
```

No es un calculo nutricional ni una verificacion de deficit. La futura regla de
constancia debera basarse en dias completos y cumplimiento del rango de ingesta.

## Rangos

| Rango | Puntos acumulados |
| --- | --- |
| Bronce | 0-6 |
| Plata | 7-29 |
| Oro | 30-59 |
| Platino | 60-99 |
| Diamante | 100-179 |
| Comprometido | 180 o mas |

Umbrales iniciales, sin temporadas ni penalizaciones por ausencia. El rango se
deriva de consistency_score con get_consistency_rank: no se permite elegirlo ni
escribirlo desde React. En Comprometido, next_rank_score es null, points_to_next
es 0 y el progreso es 100 %. El progreso de los otros rangos es interno al rango,
redondeado hacia abajo. No se aumenta la puntuacion automaticamente en esta etapa.
La propuesta para el futuro es un punto por dia completo dentro del rango de
ingesta, como maximo una vez por fecha; falta implementar y validar esa regla
en backend cuando existan comidas y objetivos historicos reales.

Para inspeccionar los limites sin cambiar perfiles:

```sql
select s.score, r.*
from (values (0), (7), (30), (60), (100), (180)) as s(score)
cross join lateral public.get_consistency_rank(s.score) r;
```

Ejecuta `supabase/tests/ranked.sql` despues de instalar para comprobar fronteras,
progreso y permisos de puntuacion. El script no modifica datos y hace rollback.

## Verificacion

Primero comprueba desde SQL Editor:

```sql
select id, tag, avatar_url, consistency_score from public.profiles;
select id, sender_id, receiver_id, status, created_at from public.friendships;
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'avatars';
select schemaname, tablename, policyname, cmd
from pg_policies
where (schemaname = 'public' and tablename in ('profiles', 'friendships'))
   or (schemaname = 'storage' and policyname like 'nutrilog_avatars_%');
```

Para probar RLS en SQL Editor, no basta con consultar como postgres: ese rol la
omite. Con tres usuarios reales A, B y C, usa este bloque, sustituyendo el UUID:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'UUID_DE_A', true);
select * from public.profiles;
select * from public.find_profile_by_tag('TAG_DE_B');
select * from public.get_friends_leaderboard();
rollback;
```

Con el mismo contexto de A, inserta una solicitud A -> B y confirma la transaccion
si quieres conservarla. En contexto de B, aceptala actualizando solo status.
Despues comprueba:

1. A y B se ven en el leaderboard; C no aparece.
2. C no ve la relacion A-B ni sus perfiles, pero puede buscar un tag exacto.
3. A no puede aceptar la solicitud que envio; B no puede volver a cambiarla.
4. Cambiar consistency_score, tag o participantes desde authenticated falla.
5. Una solicitud propia, duplicada o cruzada falla.
6. Una cuenta nueva recibe perfil y tag; las cuentas previas tambien tienen uno.
7. Con Storage API y sesiones reales: A solo sube/borra en su carpeta; un avatar
   de B requiere relacion pending/accepted; C no puede descargarlo. Probar JPG,
   PNG, WebP y el rechazo de archivos mayores a 2 MiB y formatos no permitidos.

Las pruebas de Storage se completaran al implementar la subida. No se ha
declarado esta migracion validada en una instancia real de Supabase.

Verificacion local ejecutada: instalador completo en PostgreSQL embebido
(PGlite) con esquemas minimos de auth/storage; limites de rangos, progreso,
permisos de columnas, trigger de registro, aceptacion exclusiva del receptor,
leaderboard de amigos con empates y aislamiento de perfiles por RLS correctos.
Esto valida SQL y logica, no el servicio Auth/Storage real de Supabase.

## Documentacion oficial

- https://supabase.com/docs/guides/auth/managing-user-data
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/storage/security/access-control
