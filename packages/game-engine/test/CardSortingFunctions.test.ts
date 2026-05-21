import { describe, expect, it, vi } from 'vitest';

import { Card } from '../src/card/Card';
import { Cost } from '../src/card/Cost';
import { CostSortingFunction, NameSortingFunction, TreasureCoinSortingFunction } from '../src/CardSortingFunctions';

const createMockCard = (overrides: Partial<Card>): Card => {
  return {
    getCoins: vi.fn(() => 0),
    getName: vi.fn(() => 'Copper'),
    getCost: vi.fn(() => Cost.Simple(0)),
    ...overrides,
  } as unknown as Card;
};

describe('CardSortingFunctions', () => {
  describe('TreasureCoinSortingFunction', () => {
    const fn = new TreasureCoinSortingFunction();

    it('should sort cards descending by coin value', () => {
      const copper = createMockCard({ getCoins: vi.fn(() => 1) });
      const silver = createMockCard({ getCoins: vi.fn(() => 2) });
      const gold = createMockCard({ getCoins: vi.fn(() => 3) });

      const cards = [copper, silver, gold];
      cards.sort(fn.order.bind(fn));

      expect(cards[0]).toBe(gold);
      expect(cards[1]).toBe(silver);
      expect(cards[2]).toBe(copper);
    });

    it('should return a negative number when cardA has more coins than cardB', () => {
      const cardA = createMockCard({ getCoins: vi.fn(() => 3) });
      const cardB = createMockCard({ getCoins: vi.fn(() => 1) });

      expect(fn.order(cardA, cardB)).toBeLessThan(0);
    });

    it('should return a positive number when cardA has fewer coins than cardB', () => {
      const cardA = createMockCard({ getCoins: vi.fn(() => 1) });
      const cardB = createMockCard({ getCoins: vi.fn(() => 3) });

      expect(fn.order(cardA, cardB)).toBeGreaterThan(0);
    });

    it('should return zero when both cards have the same coins', () => {
      const cardA = createMockCard({ getCoins: vi.fn(() => 2) });
      const cardB = createMockCard({ getCoins: vi.fn(() => 2) });

      expect(fn.order(cardA, cardB)).toBe(0);
    });

    it('should handle zero coin values', () => {
      const cardA = createMockCard({ getCoins: vi.fn(() => 0) });
      const cardB = createMockCard({ getCoins: vi.fn(() => 0) });

      expect(fn.order(cardA, cardB)).toBe(0);
    });
  });

  describe('NameSortingFunction', () => {
    const fn = new NameSortingFunction();

    it('should return a negative number when cardA name comes before cardB alphabetically', () => {
      const cardA = createMockCard({ getName: vi.fn(() => 'Copper') });
      const cardB = createMockCard({ getName: vi.fn(() => 'Silver') });

      expect(fn.order(cardA, cardB)).toBeLessThan(0);
    });

    it('should return a positive number when cardA name comes after cardB alphabetically', () => {
      const cardA = createMockCard({ getName: vi.fn(() => 'Silver') });
      const cardB = createMockCard({ getName: vi.fn(() => 'Copper') });

      expect(fn.order(cardA, cardB)).toBeGreaterThan(0);
    });

    it('should return zero when both cards have the same name', () => {
      const cardA = createMockCard({ getName: vi.fn(() => 'Copper') });
      const cardB = createMockCard({ getName: vi.fn(() => 'Copper') });

      expect(fn.order(cardA, cardB)).toBe(0);
    });

    it('should sort cards alphabetically', () => {
      const copper = createMockCard({ getName: vi.fn(() => 'Copper') });
      const gold = createMockCard({ getName: vi.fn(() => 'Gold') });
      const silver = createMockCard({ getName: vi.fn(() => 'Silver') });

      const cards = [silver, gold, copper];
      cards.sort(fn.order.bind(fn));

      expect(cards[0]).toBe(copper);
      expect(cards[1]).toBe(gold);
      expect(cards[2]).toBe(silver);
    });
  });

  describe('CostSortingFunction', () => {
    const fn = new CostSortingFunction();

    it('should return a negative number when cardA costs more coins than cardB', () => {
      const cardA = createMockCard({ getCost: vi.fn(() => Cost.Simple(5)) });
      const cardB = createMockCard({ getCost: vi.fn(() => Cost.Simple(3)) });

      expect(fn.order(cardA, cardB)).toBeLessThan(0);
    });

    it('should return a positive number when cardA costs fewer coins than cardB', () => {
      const cardA = createMockCard({ getCost: vi.fn(() => Cost.Simple(2)) });
      const cardB = createMockCard({ getCost: vi.fn(() => Cost.Simple(5)) });

      expect(fn.order(cardA, cardB)).toBeGreaterThan(0);
    });

    it('should fall back to name ordering when costs are the same object reference', () => {
      const copper = createMockCard({
        getCost: vi.fn(() => Cost.Simple(3)),
        getName: vi.fn(() => 'Copper'),
      });
      const silver = createMockCard({
        getCost: vi.fn(() => Cost.Simple(3)),
        getName: vi.fn(() => 'Silver'),
      });

      // Same cost object reference — triggers name sort fallback.
      // NameSortingFunction sorts alphabetically, so Copper comes before Silver → negative result.
      const cost = Cost.Simple(3);
      (copper.getCost as ReturnType<typeof vi.fn>).mockReturnValue(cost);
      (silver.getCost as ReturnType<typeof vi.fn>).mockReturnValue(cost);

      const result = fn.order(copper, silver);
      expect(result).toBeLessThan(0);
    });

    it('should sort cards descending by cost (highest cost first)', () => {
      const province = createMockCard({ getCost: vi.fn(() => Cost.Simple(8)), getName: vi.fn(() => 'Province') });
      const duchy = createMockCard({ getCost: vi.fn(() => Cost.Simple(5)), getName: vi.fn(() => 'Duchy') });
      const estate = createMockCard({ getCost: vi.fn(() => Cost.Simple(2)), getName: vi.fn(() => 'Estate') });

      const cards = [estate, duchy, province];
      cards.sort(fn.order.bind(fn));

      expect(cards[0]).toBe(province);
      expect(cards[1]).toBe(duchy);
      expect(cards[2]).toBe(estate);
    });
  });
});
