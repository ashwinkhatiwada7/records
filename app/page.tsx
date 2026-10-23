import { redirect } from "next/navigation";

// The proxy redirects "/" already; this is a fallback.
export default function Home() {
  redirect("/dashboard");
}
