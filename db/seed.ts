import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { paymentMethod, user } from "@/db/schema";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
}

const seedUsers = [
  {
    name: env("SEED_ADMIN_NAME"),
    email: env("SEED_ADMIN_EMAIL").toLowerCase(),
    password: env("SEED_ADMIN_PASSWORD"),
    role: "admin",
  },
  {
    name: env("SEED_USER_NAME"),
    email: env("SEED_USER_EMAIL").toLowerCase(),
    password: env("SEED_USER_PASSWORD"),
    role: "user",
  },
] as const;

async function main() {
  for (const seed of seedUsers) {
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, seed.email))
      .limit(1);

    if (existing) {
      console.log(
        `skip    ${seed.role.padEnd(5)} ${seed.email} (already exists)`,
      );
      continue;
    }

    // Server-side call without headers: allowed by the admin plugin, and
    // works even though public sign-up is disabled.
    await auth.api.createUser({ body: seed });
    console.log(`created ${seed.role.padEnd(5)} ${seed.email}`);
  }

  const [admin] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, seedUsers[0].email))
    .limit(1);

  for (const name of ["Cash App", "Chime", "PayPal"]) {
    const inserted = await db
      .insert(paymentMethod)
      .values({ name, createdBy: admin.id })
      .onConflictDoNothing()
      .returning({ id: paymentMethod.id });
    console.log(`${inserted.length ? "created" : "skip   "} payment method ${name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
