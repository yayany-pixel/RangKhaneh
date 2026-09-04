import type { ZodError } from "zod";

export type ActionOk = { ok: true; id?: string; message?: string };
export type ActionErr = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
};
export type ActionResult = ActionOk | ActionErr;

export const ok = (extra?: Omit<ActionOk, "ok">): ActionOk => ({
  ok: true,
  ...extra,
});
export const fail = (
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionErr => ({
  ok: false,
  error,
  fieldErrors,
});

export function fieldErrorsOf(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Suggest a title from content when the user leaves it blank. */
export function suggestTitle(content: string): string {
  const firstLine = content.trim().split(/\r?\n/)[0] ?? "";
  const words = firstLine.split(/\s+/).filter(Boolean).slice(0, 12).join(" ");
  if (!words) return "Untitled card";
  return words.length > 70 ? `${words.slice(0, 70).trim()}…` : words;
}

/** Read a trimmed string field from FormData (empty -> undefined). */
export function str(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
