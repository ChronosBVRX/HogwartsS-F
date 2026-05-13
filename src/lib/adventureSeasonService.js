
export async function getCurrentAdventureSeason(supabase) {
  const { data, error } = await supabase
    .from('hsf_current_adventure_season_view')
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCurrentSeasonAdventureSchedule(supabase) {
  const { data, error } = await supabase
    .from('hsf_current_season_adventure_schedule')
    .select('*')
    .order('unlock_week', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAvailableSeasonAdventures(supabase) {
  const { data, error } = await supabase
    .from('hsf_current_season_available_adventures')
    .select('*')
    .order('featured', { ascending: false })
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getActiveAdventureZones(supabase) {
  const { data, error } = await supabase
    .from('hsf_active_adventure_zones')
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function startSeasonAdventure(supabase, adventureId, userId) {
  const { data: run, error: runError } = await supabase
    .from('hsf_adventure_runs')
    .insert({
      adventure_id: adventureId,
      customer_id: userId,
      current_step_order: 1,
      last_scanned_step_order: 0,
      status: 'active'
    })
    .select('*')
    .single();

  if (runError) throw runError;

  const { error: variantError } = await supabase.rpc('hsf_assign_run_step_variants', {
    p_run_id: run.id
  });

  if (variantError) throw variantError;

  return run;
}

export async function getResolvedRunStep(supabase, runId, stepOrder) {
  const { data, error } = await supabase
    .from('hsf_adventure_run_steps_resolved')
    .select('*')
    .eq('run_id', runId)
    .eq('step_order', stepOrder)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function normalizeAnswer(value) {
  return String(value || '').trim().toUpperCase();
}

export function isCorrectAnswer(step, selectedValue) {
  return normalizeAnswer(selectedValue) === normalizeAnswer(step.correct_answer);
}
