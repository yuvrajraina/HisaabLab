import { describe, expect, it } from 'vitest';
import { calculators } from '../data/calculators';

describe('calculator registry', () => {
  it('contains ten unique production routes with complete SEO content', () => {
    expect(calculators).toHaveLength(10);
    expect(new Set(calculators.map(item => item.id)).size).toBe(10);
    expect(new Set(calculators.map(item => item.path)).size).toBe(10);
    calculators.forEach(item => {
      expect(item.path).toBe(`/calculators/${item.id}/`);
      expect(item.title.length).toBeGreaterThan(20);
      expect(item.description.length).toBeGreaterThan(60);
      expect(item.fields.length).toBeGreaterThanOrEqual(3);
      expect(item.faqs.length).toBeGreaterThanOrEqual(2);
      expect(item.related.length).toBeGreaterThanOrEqual(3);
    });
  });
});
