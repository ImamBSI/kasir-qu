export function formatCurrency(amount: number): string {
  return amount.toLocaleString("id-ID");
}

export function formatRupiah(amount: number): string {
  return `Rp ${formatCurrency(amount)}`;
}
