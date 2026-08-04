import { describe, expect, it } from 'vitest';
import { calculatePurchaseOptionRange, isSafePurchaseUrl, isValidPriceRange } from './purchasePlanning';

describe('purchase planning validation', () => {
  it('accepts only HTTP and HTTPS product links', () => {
    expect(isSafePurchaseUrl('https://example.com/product')).toBe(true);
    expect(isSafePurchaseUrl('http://example.com/product')).toBe(true);
    expect(isSafePurchaseUrl('javascript:alert(1)')).toBe(false);
    expect(isSafePurchaseUrl('not-a-url')).toBe(false);
  });

  it('validates optional maximum price without accepting inverted ranges', () => {
    expect(isValidPriceRange(200, null)).toBe(true);
    expect(isValidPriceRange(200, 450)).toBe(true);
    expect(isValidPriceRange(200, 100)).toBe(false);
    expect(isValidPriceRange(0, 100)).toBe(false);
  });

  it('calculates the minimum and maximum from available option totals', () => {
    expect(calculatePurchaseOptionRange([
      { valor: 100, frete: 20, disponivel: 'S' },
      { valor: 85, frete: 5, disponivel: 'S' },
      { valor: 50, frete: 0, disponivel: 'N' },
    ])).toEqual({ minimum: 90, maximum: 120 });
    expect(calculatePurchaseOptionRange([
      { valor: 50, frete: 0, disponivel: 'N' },
    ])).toBeNull();
  });
});
