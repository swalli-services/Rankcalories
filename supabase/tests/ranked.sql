-- Ejecutar despues de instalar. Pruebas sin modificar datos de usuarios.
-- Cualquier fallo lanza una excepcion. Exito: "Pruebas ranked correctas".
begin;
do $$
declare
  item record;
  actual record;
begin
  for item in select * from (values
    (0, 'Bronce', 7, 0), (6, 'Bronce', 1, 85),
    (7, 'Plata', 23, 0), (29, 'Plata', 1, 95),
    (30, 'Oro', 30, 0), (59, 'Oro', 1, 96),
    (60, 'Platino', 40, 0), (99, 'Platino', 1, 97),
    (100, 'Diamante', 80, 0), (179, 'Diamante', 1, 98),
    (180, 'Comprometido', 0, 100),
    (2147483647, 'Comprometido', 0, 100)
  ) as cases(score, label, remaining, progress)
  loop
    select * into actual from public.get_consistency_rank(item.score);
    if actual.rank_name is distinct from item.label
      or actual.points_to_next is distinct from item.remaining
      or actual.rank_progress_percent is distinct from item.progress then
      raise exception 'Fallo de rango para puntuacion %', item.score;
    end if;
  end loop;
  if exists (select 1 from public.get_consistency_rank(-1))
    or exists (select 1 from public.get_consistency_rank(null)) then
    raise exception 'No deben existir rangos para puntuaciones invalidas';
  end if;
  if has_column_privilege('authenticated', 'public.profiles', 'consistency_score', 'UPDATE')
    or has_column_privilege('authenticated', 'public.profiles', 'tag', 'UPDATE') then
    raise exception 'El cliente no debe modificar puntuacion ni tag';
  end if;
  if has_function_privilege('anon', 'public.get_friends_leaderboard()', 'EXECUTE') then
    raise exception 'El leaderboard no debe ser anonimo';
  end if;
  raise notice 'Pruebas ranked correctas';
end;
$$;
rollback;
