
-- ============================================================
-- 14_hsf_premium_adventure_get_active_update.sql
-- Actualización de hsf_get_active_adventure para leer variantes resueltas.
-- ============================================================

CREATE OR REPLACE FUNCTION public.hsf_get_active_adventure()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_run record;
  v_step record;
  v_prev_step record;
  v_today_completed boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'message', 'Debes iniciar sesión.');
  end if;

  -- 1. Verificar si ya completó o falló hoy
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

  -- 2. Buscar corrida activa
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

  -- 3. Manejo de fallos
  if v_run.failed_attempts >= 2 then
     update public.hsf_adventure_runs set status = 'abandoned', updated_at = now() where id = v_run.id;
     return jsonb_build_object(
       'ok', true, 
       'has_active', false, 
       'blocked', true, 
       'reason', 'failed_limit',
       'message', 'Has fallado demasiadas veces. La magia se ha disipado por hoy.'
     );
  end if;

  -- 4. Obtener paso actual (RESOLVED para variantes)
  select * into v_step from public.hsf_adventure_run_steps_resolved
  where run_id = v_run.id and step_order = v_run.current_step_order;

  -- 5. Obtener pista del paso anterior
  select * into v_prev_step from public.hsf_adventure_run_steps_resolved
  where run_id = v_run.id and step_order = greatest(v_run.current_step_order - 1, 1);

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
          'id', v_step.step_id,
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
