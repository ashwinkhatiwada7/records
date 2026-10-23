const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatMoney(cents: number) {
  return usd.format(cents / 100);
}

/** "12.5" -> 1250. Input is validated by `amountSchema` first. */
export function toCents(amount: string) {
  return Math.round(Number(amount) * 100);
}
