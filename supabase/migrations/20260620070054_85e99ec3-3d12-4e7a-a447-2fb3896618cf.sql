ALTER PUBLICATION supabase_realtime DROP TABLE public.published_scenarios;

REVOKE EXECUTE ON FUNCTION
  public.handle_new_user(),
  public.update_updated_at_column(),
  public.set_updated_at_finance_live_tables(),
  public.update_review_aggregates(),
  public.sync_published_scenario_like_count(),
  public.sync_published_scenario_save_count(),
  public.sync_published_scenario_play_count(),
  public.validate_review_ratings(),
  public.enforce_private_media_url_null()
FROM PUBLIC, anon, authenticated;