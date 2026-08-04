import { describe, expect, it } from 'vitest';
import { isSafePurchaseUrl, isValidPriceRange } from './purchasePlanning';

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
});
