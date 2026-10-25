-- NUTRILOG: ARCHIVO UNICO PARA PEGAR EN SUPABASE SQL EDITOR.
-- Instalacion inicial: amigos + avatares privados + rangos.
-- Ejecutar TODO como postgres. No requiere conectar GitHub.
-- Si ya ejecutaste 202610250001_friends.sql, usa SOLO
-- migrations/202610250002_ranked.sql; no este instalador.
-- Si ya existen tablas/bucket, aborta sin borrar datos.
-- No ejecutar ademas las migraciones: este archivo ya las incluye.

begin;
-- NutriLog: Paso 1. Ejecutar completo en Supabase SQL Editor como postgres.
-- Primera instalacion: si profiles o friendships ya existen, la transaccion
-- falla sin reemplazarlas. Revisar y adaptar ese esquema antes de continuar.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tag text not null unique,
  -- Ruta del objeto PRIVADO, no URL publica ni URL firmada que caduca.
  avatar_url text,
  consistency_score integer not null default 0 check (consistency_score >= 0),
  constraint profiles_tag_format check (tag ~ '^nutri#[0-9a-f]{32}$'),
  constraint profiles_avatar_path check (
    avatar_url is null or
    avatar_url ~ ('^' || id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$')
  )
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  constraint friendships_no_self check (sender_id <> receiver_id)
);

-- Una sola relacion por pareja, incluso si se invierte el remitente.
create unique index friendships_unique_pair on public.friendships (
  least(sender_id, receiver_id), greatest(sender_id, receiver_id)
);
create index friendships_sender_status on public.friendships(sender_id, status);
create index friendships_receiver_status on public.friendships(receiver_id, status);

create function public.nutrilog_create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- El UUID del usuario es unico; su representacion sin guiones tambien.
  -- No se utiliza metadata editable, nombre real ni correo para el tag.
  insert into public.profiles(id, tag)
  values (new.id, 'nutri#' || replace(new.id::text, '-', ''));
  return new;
end;
$$;
revoke all on function public.nutrilog_create_profile() from public, anon, authenticated;

create trigger nutrilog_auth_user_created
after insert on auth.users
for each row execute function public.nutrilog_create_profile();

-- Tambien crea perfiles para las cuentas que ya estaban registradas.
insert into public.profiles(id, tag)
select id, 'nutri#' || replace(id::text, '-', '') from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;

-- RLS restringe FILAS. Los grants por columna protegen tag y puntuacion.
revoke all on public.profiles from public, anon, authenticated;
revoke all on public.friendships from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (avatar_url) on public.profiles to authenticated;
grant select on public.friendships to authenticated;
grant insert (sender_id, receiver_id) on public.friendships to authenticated;
grant update (status) on public.friendships to authenticated;

create policy friendships_read_participant on public.friendships
for select to authenticated
using ((select auth.uid()) = sender_id or (select auth.uid()) = receiver_id);

create policy friendships_send_own on public.friendships
for insert to authenticated
with check (
  (select auth.uid()) = sender_id
  and sender_id <> receiver_id
  and status = 'pending'
);

-- Solo el destinatario puede responder una solicitud pendiente.
-- Los grants impiden cambiar emisor, destinatario, id o fecha.
create policy friendships_receiver_decides on public.friendships
for update to authenticated
using ((select auth.uid()) = receiver_id and status = 'pending')
with check (
  (select auth.uid()) = receiver_id
  and status in ('accepted', 'rejected')
);

create policy profiles_read_social on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1 from public.friendships f
    where f.status in ('pending', 'accepted')
      and (
        (f.sender_id = (select auth.uid()) and f.receiver_id = profiles.id)
        or (f.receiver_id = (select auth.uid()) and f.sender_id = profiles.id)
      )
  )
);

create policy profiles_update_own_avatar on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Busqueda exacta: no abre SELECT de todos los perfiles a todos los usuarios.
-- SECURITY DEFINER es intencional; devuelve solo id y tag, nunca email.
create function public.find_profile_by_tag(p_tag text)
returns table (id uuid, tag text)
language sql stable
security definer
set search_path = ''
as $$
  select p.id, p.tag
  from public.profiles p
  where (select auth.uid()) is not null
    and p.tag = lower(btrim(p_tag))
    and p.id <> (select auth.uid())
  limit 1;
$$;
revoke all on function public.find_profile_by_tag(text) from public, anon, authenticated;
grant execute on function public.find_profile_by_tag(text) to authenticated;

-- RPC preparada para el futuro hook: solo el usuario y amigos aceptados.
create function public.get_friends_leaderboard()
returns table (id uuid, tag text, avatar_url text, consistency_score integer)
language sql stable
security invoker
set search_path = ''
as $$
  select p.id, p.tag, p.avatar_url, p.consistency_score
  from public.profiles p
  where p.id = (select auth.uid())
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.sender_id = (select auth.uid()) and f.receiver_id = p.id)
          or (f.receiver_id = (select auth.uid()) and f.sender_id = p.id)
        )
    )
  order by p.consistency_score desc, p.tag asc;
$$;
revoke all on function public.get_friends_leaderboard() from public, anon, authenticated;
grant execute on function public.get_friends_leaderboard() to authenticated;

-- Bucket privado: maximo 2 MiB, sin SVG ni otros formatos activos.
-- Si ya existe avatars, detener para revisar sus politicas antes de reutilizarlo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', false, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Formato de subida: <auth.uid()>/<UUID-aleatorio>.<extension>
create policy nutrilog_avatars_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$')
);

create policy nutrilog_avatars_read on storage.objects
for select to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.profiles p
      join public.friendships f on (
        (f.sender_id = (select auth.uid()) and f.receiver_id = p.id)
        or (f.receiver_id = (select auth.uid()) and f.sender_id = p.id)
      )
      where f.status in ('pending', 'accepted') and p.avatar_url = name
    )
  )
);

create policy nutrilog_avatars_update on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$')
);

create policy nutrilog_avatars_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);


-- Segunda migracion: requiere 202610250001_friends.sql.

-- El rango se deriva del puntaje; nunca se guarda una copia desactualizada.
-- Umbrales iniciales del producto, no recomendaciones nutricionales.
create or replace function public.get_consistency_rank(p_score integer)
returns table (
  rank_name text,
  rank_min_score integer,
  next_rank_score integer,
  points_to_next integer,
  rank_progress_percent integer
)
language sql immutable strict
security invoker
set search_path = ''
as $$
  with tiers (label, minimum, next_minimum) as (
    values
      ('Bronce', 0, 7),
      ('Plata', 7, 30),
      ('Oro', 30, 60),
      ('Platino', 60, 100),
      ('Diamante', 100, 180),
      ('Comprometido', 180, null::integer)
  )
  select t.label, t.minimum, t.next_minimum,
    case when t.next_minimum is null then 0 else t.next_minimum - p_score end,
    case when t.next_minimum is null then 100
      else floor(100.0 * (p_score - t.minimum) /
        (t.next_minimum - t.minimum))::integer end
  from tiers t
  where p_score >= t.minimum
    and (t.next_minimum is null or p_score < t.next_minimum);
$$;
revoke all on function public.get_consistency_rank(integer) from public, anon, authenticated;
grant execute on function public.get_consistency_rank(integer) to authenticated;

-- Cambia el tipo de retorno de la RPC anterior; no elimina tablas ni puntajes.
drop function public.get_friends_leaderboard();
create function public.get_friends_leaderboard()
returns table (
  id uuid,
  tag text,
  avatar_url text,
  consistency_score integer,
  leaderboard_position bigint,
  rank_name text,
  rank_min_score integer,
  next_rank_score integer,
  points_to_next integer,
  rank_progress_percent integer
)
language sql stable
security invoker
set search_path = ''
as $$
  with visible_friends as (
    select p.id, p.tag, p.avatar_url, p.consistency_score
    from public.profiles p
    where p.id = (select auth.uid())
      or exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and (
            (f.sender_id = (select auth.uid()) and f.receiver_id = p.id)
            or (f.receiver_id = (select auth.uid()) and f.sender_id = p.id)
          )
      )
  )
  select p.id, p.tag, p.avatar_url, p.consistency_score,
    rank() over (order by p.consistency_score desc),
    r.rank_name, r.rank_min_score, r.next_rank_score,
    r.points_to_next, r.rank_progress_percent
  from visible_friends p
  cross join lateral public.get_consistency_rank(p.consistency_score) r
  order by p.consistency_score desc, p.tag asc;
$$;
revoke all on function public.get_friends_leaderboard() from public, anon, authenticated;
grant execute on function public.get_friends_leaderboard() to authenticated;


commit;
