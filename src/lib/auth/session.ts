import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "./allowlist";

/**
 * Returns the authenticated + allowlisted user, or null.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) return null;
  return user;
}

/**
 * Requires an authenticated + allowlisted user; redirects to /login otherwise.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Returns a request-bound Supabase client together with the authorized user.
 * Every Server Action should start here so authorization is re-checked on the
 * server (defense in depth alongside RLS).
 */
export async function getAuthedContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isEmailAllowed(user.email)) {
    redirect("/login");
  }
  return { supabase, user };
}
