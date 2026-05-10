-- ============================================================
-- 04_hsf_adventure_logic_updates.sql
-- Nuevas reglas: 2 fallos máximo y 1 vez al día.
-- Incremento de puntos comerciales (valorados por Antigravity).
-- ============================================================

-- 1. Actualizar recompensas de aventuras existentes para que sean más atractivas (valoración comercial)
-- Duplicamos o triplicamos los puntos para que se sienta el avance en el Mapa del Merodeador (meta 1,200).
update public.hsf_adventures 
set reward_points = 150 where slug = 'copa_de_las_casas_oculta'; -- Antes 50

update public.hsf_adventures 
set reward_points = 100 where slug = 'prueba_del_sombrero_antiguo'; -- Antes 40

update public.hsf_adventures 
set reward_points = 80 where slug = 'mapa_merodeador_perdido'; -- Antes 30

update public.hsf_adventures 
set reward_points = 70 where slug = 'portal_de_los_suenos'; -- Antes 25

update public.hsf_adventures 
set reward_points = 60 where slug in ('legado_de_la_serpiente', 'pocion_multijugos_inestable', 'varita_extraviada_del_callejon', 'hechizo_de_los_suenos_rotos'); -- Antes 20/25

update public.hsf_adventures 
set reward_points = 50 where slug in ('banquete_de_los_fantasmas', 'rastreo_de_galeones'); -- Antes 10/15

-- 2. Modificar hsf_adventure_runs para rastrear intentos fallidos
alter table public.hsf_adventure_runs 
add column if not exists failed_attempts integer not null default 0;

-- 3. Actualizar hsf_get_active_adventure para reportar bloqueos por fecha o fallos
create or replace function public.hsf_get_active_adventure()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run record;
  v_step record;
  v_prev_step record;
  v_today_completed boolean;
  v_today_failed boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.');
  end if;

  -- Verificar si ya completó o falló hoy (Límite 1 vez al día)
  select exists (
    select 1 from public.hsf_adventure_runs 
    where customer_id = auth.uid() 
      and (status = 'completed' or status = 'abandoned')
      and created_at::date = now()::date
  ) into v_today_completed;

  if v_today_completed then
    return jsonb_build_object(
      'ok', true, 
      'has_active', false, 
      'blocked', true, 
      'reason', 'daily_limit',
      'message', 'Ya has realizado tu aventura del día. Vuelve mañana para un nuevo desafío.'
    );
  end if;

  -- Buscar corrida activa
  select r.*, a.title, a.intro_text, a.completion_text
  into v_run
  from public.hsf_adventure_runs r
  join public.hsf_adventures a on a.id = r.adventure_id
  where r.customer_id = auth.uid()
    and r.status = 'active'
  order by r.created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('ok', true, 'has_active', false);
  end if;

  -- Si tiene 2 o más fallos, la aventura se marca como abandonada/fallida
  if v_run.failed_attempts >= 2 then
     update public.hsf_adventure_runs set status = 'abandoned', updated_at = now() where id = v_run.id;
     return jsonb_build_object(
       'ok', true, 
       'has_active', false, 
       'blocked', true, 
       'reason', 'failed_limit',
       'message', 'Has fallado demasiadas veces. La magia se ha disipado por hoy. Inténtalo de nuevo mañana.'
     );
  end if;

  select * into v_step from public.hsf_adventure_steps
  where adventure_id = v_run.adventure_id and step_order = v_run.current_step_order;

  select * into v_prev_step from public.hsf_adventure_steps
  where adventure_id = v_run.adventure_id and step_order = greatest(v_run.current_step_order - 1, 1);

  return jsonb_build_object(
    'ok', true,
    'has_active', true,
    'run_id', v_run.id,
    'adventure_id', v_run.adventure_id,
    'title', v_run.title,
    'current_step_order', v_run.current_step_order,
    'last_scanned_step_order', v_run.last_scanned_step_order,
    'failed_attempts', v_run.failed_attempts,
    'needs_scan', v_run.last_scanned_step_order <> v_run.current_step_order,
    'clue', case
      when v_run.last_scanned_step_order <> v_run.current_step_order then coalesce(v_prev_step.clue_to_next_zone, 'Busca el siguiente portal mágico.')
      else null
    end,
    'step', case
      when v_run.last_scanned_step_order = v_run.current_step_order then
        jsonb_build_object(
          'step_id', v_step.id,
          'step_order', v_step.step_order,
          'narrator_name', v_step.narrator_name,
          'narrator_line', v_step.narrator_line,
          'story_text', v_step.story_text,
          'question', v_step.question,
          'options', v_step.options,
          'difficulty', v_step.difficulty
        )
      else null
    end
  );
end;
$$;

-- 4. Actualizar hsf_answer_adventure_step para manejar el límite de 2 fallos
create or replace function public.hsf_answer_adventure_step(
  p_run_id uuid,
  p_answer text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run record;
  v_step record;
  v_adv record;
  v_total_steps integer;
  v_is_correct boolean;
  v_next_step record;
  v_reward record;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.');
  end if;

  select * into v_run from public.hsf_adventure_runs
  where id = p_run_id and customer_id = auth.uid() and status = 'active';

  if not found then
    return jsonb_build_object('ok', false, 'message', 'No hay una aventura activa.');
  end if;

  if v_run.failed_attempts >= 2 then
    return jsonb_build_object('ok', false, 'message', 'Has agotado tus oportunidades del día.');
  end if;

  if v_run.last_scanned_step_order <> v_run.current_step_order then
    return jsonb_build_object('ok', false, 'needs_scan', true, 'message', 'Primero debes escanear el portal.');
  end if;

  select * into v_step from public.hsf_adventure_steps
  where adventure_id = v_run.adventure_id and step_order = v_run.current_step_order;

  v_is_correct := lower(trim(coalesce(p_answer, ''))) = lower(trim(v_step.correct_answer));

  insert into public.hsf_adventure_attempts (run_id, step_id, scanned_zone_id, answer_given, is_correct)
  values (v_run.id, v_step.id, v_step.required_zone_id, p_answer, v_is_correct);

  if not v_is_correct then
    update public.hsf_adventure_runs 
    set failed_attempts = failed_attempts + 1, updated_at = now() 
    where id = v_run.id
    returning failed_attempts into v_total_steps; -- Reusando variable para el conteo

    if v_total_steps >= 2 then
      update public.hsf_adventure_runs set status = 'abandoned', updated_at = now() where id = v_run.id;
      return jsonb_build_object(
        'ok', false, 
        'correct', false, 
        'out_of_attempts', true,
        'message', 'Respuesta incorrecta. Has agotado tus 2 oportunidades. La aventura termina por hoy.'
      );
    end if;

    return jsonb_build_object(
      'ok', false, 
      'correct', false, 
      'remaining_attempts', 2 - v_total_steps,
      'message', coalesce(v_step.wrong_feedback, 'Respuesta incorrecta.') || ' Te queda 1 oportunidad.'
    );
  end if;

  -- Lógica de completar (IGUAL A LA ANTERIOR PERO MANTENIENDO EL FLUJO)
  select count(*) into v_total_steps from public.hsf_adventure_steps where adventure_id = v_run.adventure_id;
  select * into v_adv from public.hsf_adventures where id = v_run.adventure_id;

  if v_run.current_step_order >= v_total_steps then
    update public.hsf_adventure_runs set status = 'completed', completed_at = now(), updated_at = now() where id = v_run.id;
    insert into public.hsf_adventure_rewards (run_id, customer_id, reward_title, reward_description, reward_points, min_consumption, status)
    values (v_run.id, auth.uid(), v_adv.reward_title, v_adv.reward_description, v_adv.reward_points, v_adv.min_consumption, 'available')
    returning * into v_reward;

    if v_adv.reward_points > 0 then
      insert into public.hsf_points_ledger (user_id, points, reason, created_by)
      values (auth.uid(), v_adv.reward_points, 'Aventura completada: ' || v_adv.title, auth.uid());
      update public.hsf_profiles set loyalty_points = loyalty_points + v_adv.reward_points, updated_at = now() where user_id = auth.uid();
    end if;

    return jsonb_build_object('ok', true, 'correct', true, 'completed', true, 'reward_points', v_reward.reward_points, 'reward_title', v_reward.reward_title);
  end if;

  update public.hsf_adventure_runs set current_step_order = current_step_order + 1, updated_at = now() where id = v_run.id;
  return jsonb_build_object('ok', true, 'correct', true, 'completed', false, 'message', '¡Correcto! El camino se revela.');
end;
$$;
