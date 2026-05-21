import { describe, expect, it } from 'vitest';

import { Cost } from '../../src/card/Cost';
import { Pile } from '../../src/piles/Pile';
import { CostPileSortingFunction } from '../../src/piles/PileSortingFunctions';

const createPile = (cost: Cost): Pile => {
  return {
    cost,
  } as unknown as Pile;
};

describe('PileSortingFunctions', () => {
  const fn = new CostPileSortingFunction();

  it('sorts by coin cost before potion and debt cost', () => {
    const lowCoins = createPile(Cost.Simple(3));
    const highCoins = createPile(Cost.Simple(5));

    expect(fn.order(highCoins, lowCoins)).toBeGreaterThan(0);
    expect(fn.order(lowCoins, highCoins)).toBeLessThan(0);
  });

  it('uses potion cost as a tiebreaker when coin costs are equal', () => {
    const withPotion = createPile(Cost.Potion(4));
    const withoutPotion = createPile(Cost.Simple(4));

    expect(fn.order(withPotion, withoutPotion)).toBeGreaterThan(0);
    expect(fn.order(withoutPotion, withPotion)).toBeLessThan(0);
  });

  it('uses debt cost as the final tiebreaker when coin and potion costs are equal', () => {
    const withDebt = createPile(Cost.Debt(4, 2));
    const withoutDebt = createPile(Cost.Simple(4));

    expect(fn.order(withDebt, withoutDebt)).toBeGreaterThan(0);
    expect(fn.order(withoutDebt, withDebt)).toBeLessThan(0);
    expect(fn.order(withoutDebt, createPile(Cost.Simple(4)))).toBe(0);
  });
});
