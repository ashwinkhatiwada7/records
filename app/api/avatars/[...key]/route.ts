import { getSession } from "@/lib/session";
import { getAvatar } from "@/lib/storage";

/** Serves private customer photos to signed-in users only. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });

  const { key } = await params;
  const avatar = await getAvatar(key.join("/"));
  if (!avatar) return new Response("Not found", { status: 404 });

  return new Response(avatar.body, {
    headers: {
      "Content-Type": avatar.contentType,
      ...(avatar.length && { "Content-Length": String(avatar.length) }),
      // keys are random UUIDs and never reused, so the browser may cache for good,
      // but only privately (no shared CDN caches)
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
