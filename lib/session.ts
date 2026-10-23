import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Authoritative check (hits the DB). The proxy only does an optimistic cookie check. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
