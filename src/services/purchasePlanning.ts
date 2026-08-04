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
