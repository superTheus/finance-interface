export function isSafePurchaseUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function isValidPriceRange(minimum: number, maximum?: number | null): boolean {
  return Number.isFinite(minimum)
    && minimum > 0
    && (maximum === null || maximum === undefined || (Number.isFinite(maximum) && maximum >= minimum));
}

type PurchaseOptionPrice = {
  valor: number,
  frete?: number | null,
  disponivel: 'S' | 'N'
};

export function calculatePurchaseOptionRange(options: PurchaseOptionPrice[]): { minimum: number, maximum: number } | null {
  const totals = options
    .filter((option) => option.disponivel === 'S')
    .map((option) => option.valor + (option.frete || 0))
    .filter((total) => Number.isFinite(total) && total > 0);

  if (!totals.length) return null;

  return {
    minimum: Math.min(...totals),
    maximum: Math.max(...totals),
  };
}
