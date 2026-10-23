"use client";

/** Dates are rendered in the viewer's timezone; the server's may differ. */
export function LocalDate({
  value,
  withTime = false,
}: {
  value: Date | string | null;
  withTime?: boolean;
}) {
  if (!value) return <span>—</span>;
  const date = new Date(value);
  return (
    <span suppressHydrationWarning>
      {date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        ...(withTime && { hour: "numeric", minute: "2-digit" }),
      })}
    </span>
  );
}
