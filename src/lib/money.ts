/** All money is stored as integer cents of the row's display currency. */

const SUPPORTED = new Set(["USD", "EUR", "GBP"]);

export function parseDollarsToCents(input: string): number | null {
  const value = Number.parseFloat(input.replace(/[$€£,\s]/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export function centsToDollars(cents: number, currency: string = "USD"): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: SUPPORTED.has(currency) ? currency : "USD",
  });
}

/** Display symbol for input affordances (the "$"/"€"/"£" in amount fields). */
export function currencySymbol(currency: string = "USD"): string {
  return { USD: "$", EUR: "€", GBP: "£" }[SUPPORTED.has(currency) ? currency : "USD"] ?? "$";
}

export function centsToPlain(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatAccountNumber(n: string): string {
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** UK sort codes render in three pairs: 04-11-27. */
export function formatSortCode(n: string): string {
  return n.replace(/\D/g, "").slice(0, 6).replace(/(\d{2})(?=\d)/g, "$1-");
}

export const txnTypeLabels: Record<string, string> = {
  DEPOSIT: "Deposit",
  WITHDRAW: "Withdrawal",
  TRANSFER_OUT: "Transfer Out",
  TRANSFER_IN: "Transfer In",
  PAYMENT_OUT: "Payment Sent",
  PAYMENT_IN: "Payment Received",
  ADJUSTMENT: "Account Adjustment",
};

export function txnColor(type: string): string {
  return type.endsWith("_IN") || type === "DEPOSIT" ? "+ " : "- ";
}
