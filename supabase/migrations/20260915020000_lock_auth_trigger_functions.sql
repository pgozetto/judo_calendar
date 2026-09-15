-- Funções de gatilho não devem ficar expostas como RPC pública.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_auth_user_updated() from public, anon, authenticated;
revoke all on function public.ensure_user_workspace() from public, anon;
grant execute on function public.ensure_user_workspace() to authenticated;
