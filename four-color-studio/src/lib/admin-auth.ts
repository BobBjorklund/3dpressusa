import { cookies } from "next/headers";

// Lightweight gate for the internal pet-design admin pages — a single shared
// secret in a cookie, not a full user/session auth system (this app has
// none). Good enough for a solo operator reviewing customer submissions.
export const ADMIN_COOKIE = "admin_key";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  return !!value && value === process.env.ADMIN_KEY;
}
