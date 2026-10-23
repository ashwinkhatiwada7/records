"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { customer, entry, game, paymentMethod } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ActionError, requireAdmin, requireUser, runAction } from "@/lib/authz";
import { deleteAvatar, uploadAvatar } from "@/lib/storage";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/db-errors";
import {
  MAX_AVATAR_BYTES,
  appUserSchema,
  customerSchema,
  nameSchema,
  type AppUserValues,
  type NameValues,
} from "@/lib/validations";

function parse<T>(
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: { message: string }[] } } },
  values: unknown,
): T {
  const parsed = schema.safeParse(values);
  if (!parsed.success) throw new ActionError(parsed.error!.issues[0].message);
  return parsed.data as T;
}

// ---- customers ------------------------------------------------------------

/** FormData because of the optional photo: name, phone, profileUrl, image (File). */
export async function createCustomer(formData: FormData) {
  return runAction(async () => {
    const user = await requireUser();
    const data = parse(customerSchema, {
      name: formData.get("name") ?? "",
      phone: formData.get("phone") ?? "",
      profileUrl: formData.get("profileUrl") ?? "",
    });

    let imageUrl: string | undefined;
    const image = formData.get("image");
    if (image instanceof File && image.size > 0) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
        throw new ActionError("Photo must be a JPG, PNG or WebP image");
      }
      if (image.size > MAX_AVATAR_BYTES) {
        throw new ActionError("Photo is too large (max 2 MB)");
      }
      imageUrl = await uploadAvatar(image);
    }

    await db.insert(customer).values({ ...data, imageUrl, createdBy: user.id });
    revalidatePath("/dashboard/customers");
  });
}

/** Admin only. Refused while the customer has entries, so page totals never change silently. */
export async function deleteCustomer(id: string) {
  return runAction(async () => {
    await requireAdmin();
    const [found] = await db
      .select({ name: customer.name, imageUrl: customer.imageUrl })
      .from(customer)
      .where(eq(customer.id, id))
      .limit(1);
    if (!found) throw new ActionError("Customer not found");

    const [{ n }] = await db
      .select({ n: count() })
      .from(entry)
      .where(eq(entry.customerId, id));
    if (n > 0) {
      throw new ActionError(
        `${found.name} has ${n} ${n === 1 ? "entry" : "entries"} on existing pages, so they can't be deleted. Delete those entries or their pages first.`,
      );
    }

    try {
      await db.delete(customer).where(eq(customer.id, id));
    } catch (e) {
      // an entry was added between the check and the delete
      if (isForeignKeyViolation(e)) {
        throw new ActionError(`${found.name} still has entries, so they can't be deleted.`);
      }
      throw e;
    }
    await deleteAvatar(found.imageUrl);
    revalidatePath("/dashboard/customers");
  });
}

// ---- games and payment methods (same shape) -------------------------------

const catalogs = {
  game: { table: game, path: "/dashboard/games", label: "game" },
  paymentMethod: {
    table: paymentMethod,
    path: "/dashboard/payment-methods",
    label: "payment method",
  },
} as const;
type CatalogKey = keyof typeof catalogs;

export async function createCatalogItem(key: CatalogKey, values: NameValues) {
  return runAction(async () => {
    const user = await requireUser();
    const { table, path, label } = catalogs[key];
    const data = parse(nameSchema, values);
    try {
      await db.insert(table).values({ name: data.name, createdBy: user.id });
    } catch (e) {
      if (isUniqueViolation(e)) throw new ActionError(`That ${label} already exists`);
      throw e;
    }
    revalidatePath(path);
  });
}

export async function renameCatalogItem(key: CatalogKey, id: string, values: NameValues) {
  return runAction(async () => {
    await requireAdmin();
    const { table, path, label } = catalogs[key];
    const data = parse(nameSchema, values);
    try {
      await db.update(table).set({ name: data.name }).where(eq(table.id, id));
    } catch (e) {
      if (isUniqueViolation(e)) throw new ActionError(`That ${label} already exists`);
      throw e;
    }
    revalidatePath(path);
  });
}

export async function setCatalogItemActive(key: CatalogKey, id: string, isActive: boolean) {
  return runAction(async () => {
    await requireAdmin();
    const { table, path } = catalogs[key];
    await db.update(table).set({ isActive }).where(eq(table.id, id));
    revalidatePath(path);
  });
}

export async function deleteCatalogItem(key: CatalogKey, id: string) {
  return runAction(async () => {
    await requireAdmin();
    const { table, path } = catalogs[key];
    try {
      await db.delete(table).where(eq(table.id, id));
    } catch (e) {
      if (isForeignKeyViolation(e)) {
        throw new ActionError("It is used by existing entries. Disable it instead.");
      }
      throw e;
    }
    revalidatePath(path);
  });
}

// ---- app users (admin) ----------------------------------------------------

export async function createAppUser(values: AppUserValues) {
  return runAction(async () => {
    await requireAdmin();
    const data = parse(appUserSchema, values);
    try {
      // Server-side call without headers is allowed by the admin plugin;
      // authorization was checked above.
      await auth.api.createUser({ body: data });
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (/exist/i.test(message)) throw new ActionError("That email is already in use");
      throw e;
    }
    revalidatePath("/dashboard/users");
  });
}
