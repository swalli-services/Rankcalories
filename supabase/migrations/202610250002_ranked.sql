-- Segunda migracion: requiere 202610250001_friends.sql.
begin;

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
