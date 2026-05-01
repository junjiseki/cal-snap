create policy "ai_logs_update_own" on public.ai_analysis_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
