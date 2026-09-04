// Email allowlist — the only path to access. There is no public signup.

export function getAllowlist(): string[] {
  return (process.env.AUTH_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email?: string | null): boolean {
  if (!email) return false;
  return getAllowlist().includes(email.toLowerCase());
}
