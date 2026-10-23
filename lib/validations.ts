import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginValues = z.infer<typeof loginSchema>;

const name = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(80, "Too long");
const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max, "Too long")
    .optional()
    .transform((v) => v || undefined);

/** Dollar amount typed by the user, e.g. "12" or "12.50". Positive, max 2 decimals. */
export const amountSchema = z
  .string()
  .trim()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter a valid amount, e.g. 25 or 25.50")
  .refine((v) => Number(v) > 0, "Amount must be greater than 0");

export const pageSchema = z.object({
  title: name("Title"),
});

export const entrySchema = z
  .object({
    pageId: z.string().min(1),
    type: z.enum(["in", "out"]),
    customerId: z.string().min(1, "Choose a customer"),
    paymentMethodId: z.string().min(1, "Choose a payment method"),
    /** One payment can cover several games. Required for payments in. */
    gameIds: z.array(z.string()).default([]),
    amount: amountSchema,
  })
  .refine((v) => v.type === "out" || v.gameIds.length > 0, {
    path: ["gameIds"],
    message: "Choose at least one game",
  });

export const expenseSchema = z.object({
  pageId: z.string().min(1),
  description: name("Description"),
  amount: amountSchema,
  paymentMethodId: z.string().optional(),
});

export const customerSchema = z.object({
  name: name("Name"),
  phone: optionalText(30),
  profileUrl: z
    .string()
    .trim()
    .max(300, "Too long")
    .optional()
    .transform((v) => v || undefined)
    .refine(
      (v) => {
        if (!v) return true;
        try {
          return ["http:", "https:"].includes(new URL(v).protocol);
        } catch {
          return false;
        }
      },
      "Enter a full link, e.g. https://facebook.com/username",
    ),
});

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export const nameSchema = z.object({ name: name("Name") });

export const appUserSchema = z.object({
  name: name("Name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]),
});

export type PageValues = z.input<typeof pageSchema>;
export type EntryValues = z.input<typeof entrySchema>;
export type ExpenseValues = z.input<typeof expenseSchema>;
export type CustomerValues = z.input<typeof customerSchema>;
export type NameValues = z.input<typeof nameSchema>;
export type AppUserValues = z.input<typeof appUserSchema>;
