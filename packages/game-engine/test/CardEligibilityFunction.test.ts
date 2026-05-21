import { describe, expect, it, vi } from 'vitest';

import { Card } from '../src/card/Card';
import { CardCollection } from '../src/card/CardCollection';
import { CardEligibilityFunction } from '../src/CardEligibilityFunction';

const createMockCard = (id: string, name = 'Test Card'): Card => {
  return {
    getId: vi.fn(() => id),
    getName: vi.fn(() => name),
  } as unknown as Card;
};

const alwaysMatches = new CardEligibilityFunction(() => true);
const neverMatches = new CardEligibilityFunction(() => false);

describe('CardEligibilityFunction', () => {
  describe('matches', () => {
    it('should return true when the internal function returns true', () => {
      const card = createMockCard('1');
      expect(alwaysMatches.matches(card)).toBe(true);
    });

    it('should return false when the internal function returns false', () => {
      const card = createMockCard('1');
      expect(neverMatches.matches(card)).toBe(false);
    });

    it('should pass the card to the internal function', () => {
      const card = createMockCard('1');
      const internalFn = vi.fn(() => true);
      const fn = new CardEligibilityFunction(internalFn);

      fn.matches(card);

      expect(internalFn).toHaveBeenCalledWith(card);
    });

    it('should evaluate the internal function independently for each card', () => {
      const card1 = createMockCard('1', 'Copper');
      const card2 = createMockCard('2', 'Gold');

      const fn = new CardEligibilityFunction((c: Card) => c.getName() === 'Copper');

      expect(fn.matches(card1)).toBe(true);
      expect(fn.matches(card2)).toBe(false);
    });
  });

  describe('matchesAny', () => {
    it('should return true when at least one card matches', () => {
      const collection = CardCollection.fromCards([createMockCard('1'), createMockCard('2')]);

      expect(alwaysMatches.matchesAny(collection)).toBe(true);
    });

    it('should return false when no cards match', () => {
      const collection = CardCollection.fromCards([createMockCard('1'), createMockCard('2')]);

      expect(neverMatches.matchesAny(collection)).toBe(false);
    });

    it('should return false for an empty collection', () => {
      const collection = CardCollection.emptyCollection();

      expect(alwaysMatches.matchesAny(collection)).toBe(false);
    });

    it('should return true when only one card in a mixed collection matches', () => {
      const copper = createMockCard('1', 'Copper');
      const silver = createMockCard('2', 'Silver');
      const collection = CardCollection.fromCards([copper, silver]);

      const fn = new CardEligibilityFunction((c: Card) => c.getName() === 'Copper');

      expect(fn.matchesAny(collection)).toBe(true);
    });

    it('should return false when no cards in a mixed collection match', () => {
      const silver = createMockCard('1', 'Silver');
      const gold = createMockCard('2', 'Gold');
      const collection = CardCollection.fromCards([silver, gold]);

      const fn = new CardEligibilityFunction((c: Card) => c.getName() === 'Copper');

      expect(fn.matchesAny(collection)).toBe(false);
    });
  });

  describe('getMatchingCards', () => {
    it('should return all cards when all match', () => {
      const card1 = createMockCard('1');
      const card2 = createMockCard('2');
      const collection = CardCollection.fromCards([card1, card2]);

      const result = alwaysMatches.getMatchingCards(collection);

      expect(result.size()).toBe(2);
    });

    it('should return no cards when none match', () => {
      const collection = CardCollection.fromCards([createMockCard('1'), createMockCard('2')]);

      const result = neverMatches.getMatchingCards(collection);

      expect(result.size()).toBe(0);
    });

    it('should return only matching cards from a mixed collection', () => {
      const copper = createMockCard('1', 'Copper');
      const silver = createMockCard('2', 'Silver');
      const copper2 = createMockCard('3', 'Copper');
      const collection = CardCollection.fromCards([copper, silver, copper2]);

      const fn = new CardEligibilityFunction((c: Card) => c.getName() === 'Copper');
      const result = fn.getMatchingCards(collection);

      expect(result.size()).toBe(2);
    });

    it('should return an empty collection for an empty input collection', () => {
      const result = alwaysMatches.getMatchingCards(CardCollection.emptyCollection());

      expect(result.size()).toBe(0);
    });

    it('should not modify the original collection', () => {
      const collection = CardCollection.fromCards([createMockCard('1'), createMockCard('2')]);

      neverMatches.getMatchingCards(collection);

      expect(collection.size()).toBe(2);
    });
  });

  describe('getMatchingCardsUnique', () => {
    it('should return unique matches by card name', () => {
      const copper1 = createMockCard('1', 'Copper');
      const copper2 = createMockCard('2', 'Copper');
      const silver = createMockCard('3', 'Silver');
      const collection = CardCollection.fromCards([copper1, copper2, silver]);

      const result = alwaysMatches.getMatchingCardsUnique(collection);

      expect(result.size()).toBe(2); // one Copper and one Silver
    });

    it('should deduplicate copies of the same card name', () => {
      const copper1 = createMockCard('1', 'Copper');
      const copper2 = createMockCard('2', 'Copper');
      const copper3 = createMockCard('3', 'Copper');
      const collection = CardCollection.fromCards([copper1, copper2, copper3]);

      const result = alwaysMatches.getMatchingCardsUnique(collection);

      expect(result.size()).toBe(1);
    });

    it('should return no cards when none match', () => {
      const collection = CardCollection.fromCards([createMockCard('1', 'Copper'), createMockCard('2', 'Copper')]);

      const result = neverMatches.getMatchingCardsUnique(collection);

      expect(result.size()).toBe(0);
    });

    it('should return an empty collection for an empty input', () => {
      const result = alwaysMatches.getMatchingCardsUnique(CardCollection.emptyCollection());

      expect(result.size()).toBe(0);
    });

    it('should only return unique matches from matching cards', () => {
      const copper1 = createMockCard('1', 'Copper');
      const copper2 = createMockCard('2', 'Copper');
      const silver = createMockCard('3', 'Silver');
      const collection = CardCollection.fromCards([copper1, copper2, silver]);

      const fn = new CardEligibilityFunction((c: Card) => c.getName() === 'Copper');
      const result = fn.getMatchingCardsUnique(collection);

      expect(result.size()).toBe(1);
    });
  });

  describe('numMatchingCards', () => {
    it('should return the total number of matching cards', () => {
      const collection = CardCollection.fromCards([createMockCard('1'), createMockCard('2'), createMockCard('3')]);

      expect(alwaysMatches.numMatchingCards(collection)).toBe(3);
    });

    it('should return zero when no cards match', () => {
      const collection = CardCollection.fromCards([createMockCard('1'), createMockCard('2')]);

      expect(neverMatches.numMatchingCards(collection)).toBe(0);
    });

    it('should return zero for an empty collection', () => {
      expect(alwaysMatches.numMatchingCards(CardCollection.emptyCollection())).toBe(0);
    });

    it('should count duplicates (same name, different IDs)', () => {
      const copper1 = createMockCard('1', 'Copper');
      const copper2 = createMockCard('2', 'Copper');
      const collection = CardCollection.fromCards([copper1, copper2]);

      const fn = new CardEligibilityFunction((c: Card) => c.getName() === 'Copper');

      expect(fn.numMatchingCards(collection)).toBe(2);
    });

    it('should count only matching cards in a mixed collection', () => {
      const copper1 = createMockCard('1', 'Copper');
      const copper2 = createMockCard('2', 'Copper');
      const silver = createMockCard('3', 'Silver');
      const collection = CardCollection.fromCards([copper1, copper2, silver]);

      const fn = new CardEligibilityFunction((c: Card) => c.getName() === 'Copper');

      expect(fn.numMatchingCards(collection)).toBe(2);
    });
  });
});
