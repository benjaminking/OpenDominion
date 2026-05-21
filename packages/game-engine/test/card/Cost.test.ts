import { describe, expect, it } from 'vitest';

import { Cost } from '../../src/card/Cost';

describe('Cost', () => {
  it('builds simple, potion, and debt costs', () => {
    expect(Cost.Simple(5).toCommonCost()).toEqual({
      coins: 5,
      potions: 0,
      debt: 0,
      has_asterisk: false,
    });
    expect(Cost.Potion(4).toCommonCost()).toEqual({
      coins: 4,
      potions: 1,
      debt: 0,
      has_asterisk: false,
    });
    expect(Cost.Debt(3, 8).toCommonCost()).toEqual({
      coins: 3,
      potions: 0,
      debt: 8,
      has_asterisk: false,
    });
  });

  it('builds from common cost with optional fields omitted', () => {
    const cost = Cost.fromCommonCost({
      coins: 6,
      has_asterisk: true,
    });

    expect(cost.toCommonCost()).toEqual({
      coins: 6,
      potions: 0,
      debt: 0,
      has_asterisk: true,
    });
  });

  it('adds coins without mutating the original cost', () => {
    const original = Cost.Potion(4);
    const updated = original.plus(3);

    expect(updated.toCommonCost()).toEqual({
      coins: 7,
      potions: 1,
      debt: 0,
      has_asterisk: false,
    });
    expect(original.toCommonCost()).toEqual({
      coins: 4,
      potions: 1,
      debt: 0,
      has_asterisk: false,
    });
  });

  it('floors coin addition at zero', () => {
    const updated = Cost.Debt(2, 5).plus(-10);

    expect(updated.toCommonCost()).toEqual({
      coins: 0,
      potions: 0,
      debt: 5,
      has_asterisk: false,
    });
  });

  it('compares costs by all three dimensions', () => {
    const smaller = Cost.fromCommonCost({ coins: 3, potions: 0, debt: 0, has_asterisk: false });
    const larger = Cost.fromCommonCost({ coins: 5, potions: 1, debt: 2, has_asterisk: false });
    const mixed = Cost.fromCommonCost({ coins: 3, potions: 1, debt: 1, has_asterisk: false });

    expect(smaller.isLessThanOrEqualTo(larger)).toBe(true);
    expect(smaller.isLessThan(larger)).toBe(true);
    expect(larger.isLessThan(smaller)).toBe(false);
    expect(mixed.isLessThanOrEqualTo(larger)).toBe(true);
    expect(mixed.isEqualTo(Cost.fromCommonCost({ coins: 3, potions: 1, debt: 1, has_asterisk: false }))).toBe(true);
  });

  it('formats supported string representations', () => {
    expect(Cost.Simple(5).toString()).toBe('$5');
    expect(Cost.Potion(4).toString()).toBe('$4P');
    expect(Cost.Potion(0).toString()).toBe('$P');
    expect(Cost.Debt(3, 8).toString()).toBe('8D$3');
    expect(Cost.Debt(0, 8).toString()).toBe('8D');
  });

  it('throws for unsupported cost combinations', () => {
    const cost = Cost.fromCommonCost({
      coins: 0,
      potions: 2,
      debt: 0,
      has_asterisk: false,
    });

    expect(() => cost.toString()).toThrow('Unsupported cost combination');
  });
});
