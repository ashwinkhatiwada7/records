import "server-only";
import { requireSession } from "@/lib/session";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

export class ActionError extends Error {}

/** Any signed-in user. */
export async function requireUser() {
  return (await requireSession()).user;
}

/** Admin only. Throws an ActionError that `runAction` turns into a result. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new ActionError("Only an admin can do this");
  }
  return user;
}

export function isAdmin(role: string | null | undefined) {
  return role === "admin";
}

/** Wraps an action body so expected failures come back as `{ ok: false, error }`. */
export async function runAction<T = undefined>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return (data === undefined ? { ok: true } : { ok: true, data }) as ActionResult<T>;
  } catch (error) {
    if (error instanceof ActionError) return { ok: false, error: error.message };
    // redirect()/notFound() from requireSession must keep propagating
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error(error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
