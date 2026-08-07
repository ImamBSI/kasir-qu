export function formatCurrency(amount: number): string {
  return amount.toLocaleString("id-ID");
}

export function formatRupiah(amount: number): string {
  return `Rp ${formatCurrency(amount)}`;
}

export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };