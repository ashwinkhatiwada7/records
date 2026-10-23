import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { ActionError } from "@/lib/authz";

/** Object keys we create look like customers/<uuid>.jpg. Anything else is rejected. */
export const AVATAR_KEY = /^customers\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function config() {
  const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET } =
    process.env;
  if (!S3_ENDPOINT || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET) {
    return null;
  }
  return {
    bucket: S3_BUCKET,
    client: new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      forcePathStyle: true, // required by Supabase's S3 endpoint
      credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
    }),
  };
}

/**
 * Uploads to the private bucket and returns the app URL used to show the image.
 * The bucket is private, so the URL points at our authenticated route
 * (app/api/avatars/[...key]/route.ts), not at Supabase.
 */
export async function uploadAvatar(file: File) {
  const s3 = config();
  if (!s3) {
    throw new ActionError(
      "Photo storage is not set up yet. Add the S3_* values to .env, or save the customer without a photo.",
    );
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = `customers/${crypto.randomUUID()}.${ext}`;

  try {
    await s3.client.send(
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: key,
        Body: new Uint8Array(await file.arrayBuffer()),
        ContentType: file.type,
      }),
    );
  } catch (e) {
    console.error("avatar upload failed", e);
    throw new ActionError("Photo upload failed. Check the storage settings and try again.");
  }

  return `/api/avatars/${key}`;
}

/** Streams an object out of the private bucket. Returns null if it does not exist. */
export async function getAvatar(key: string) {
  const s3 = config();
  if (!s3 || !AVATAR_KEY.test(key)) return null;
  try {
    const res = await s3.client.send(new GetObjectCommand({ Bucket: s3.bucket, Key: key }));
    if (!res.Body) return null;
    return {
      body: res.Body.transformToWebStream(),
      contentType: MIME[key.split(".").pop()!] ?? "application/octet-stream",
      length: res.ContentLength,
    };
  } catch (e) {
    if ((e as { name?: string }).name === "NoSuchKey") return null;
    console.error("avatar read failed", e);
    return null;
  }
}

/** Best effort: removes the object behind an `/api/avatars/<key>` URL. Never throws. */
export async function deleteAvatar(imageUrl: string | null | undefined) {
  const s3 = config();
  const key = imageUrl?.replace(/^\/api\/avatars\//, "");
  if (!s3 || !key || !AVATAR_KEY.test(key)) return;
  try {
    await s3.client.send(new DeleteObjectCommand({ Bucket: s3.bucket, Key: key }));
  } catch (e) {
    console.error("avatar delete failed", e);
  }
}
