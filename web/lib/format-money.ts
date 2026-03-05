export function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}
