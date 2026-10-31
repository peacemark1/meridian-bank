/** All money is stored as integer cents. */

export function parseDollarsToCents(input: string): number | null {
  const value = Number.parseFloat(input.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function centsToPlain(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatAccountNumber(n: string): string {
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
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
