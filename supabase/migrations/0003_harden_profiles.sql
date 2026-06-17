-- ============================================================================
-- Harden profiles against privilege escalation.
-- A user could previously update ANY column of their own profile row (the
-- "own update" RLS policy is row-level, not column-level) — including
-- role / plan / verify_status. Fix: remove blanket UPDATE and grant UPDATE
-- only on the safe, user-owned columns. Privileged columns can then only be
-- changed by the service role (server actions / admin / Stripe webhook).
-- ============================================================================

revoke update on public.profiles from authenticated;
revoke update on public.profiles from anon;

grant update (full_name, avatar_url, school, goal, priorities, onboarded)
  on public.profiles to authenticated;

-- role, plan, verify_status, suspended, id, created_at remain non-updatable by
-- end users. RLS still restricts updates to the user's own row.
