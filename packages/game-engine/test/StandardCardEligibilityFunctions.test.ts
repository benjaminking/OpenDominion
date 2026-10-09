import { CardCategory, CardLocation, CardType, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../src/card/Card';
import { CardCollection } from '../src/card/CardCollection';
import { Cost } from '../src/card/Cost';
import { KingdomCard } from '../src/card/KingdomCard';
import { SharedGameState } from '../src/game-state/SharedGameState';
import {
  anyCard,
  both,
  canBeDiscardedInCleanup,
  cardNameIs,
  costsAtLeast,
  costsBetween,
  costsExactly,
  costsExactlyNLessThanCard,
  costsExactlyNMoreThanCard,
  costsLessThan,
  costsLessThanCard,
  costsTheSameAsCard,
  costsTheSameOrLessThanCard,
  costsUpTo,
  costsUpToNMoreThanCard,
  either,
  isACopyOf,
  isActionCard,
  isAttackCard,
  isCommandCard,
  isCurseCard,
  isDuplicateWith,
  isDurationCard,
  isFromExpansion,
  isInLocation,
  isKingdomCard,
  isKnightCard,
  isRewardCard,
  isRuinsCard,
  isShelterCard,
  isSimpleTreasure,
  isSupplyCard,
  isTheSameCardAs,
  isTreasureCard,
  isVictoryCard,
  noCard,
  not,
} from '../src/StandardCardEligibilityFunctions';

// Mock Card and CardInfo
const createMockCard = (overrides?: Partial<Card>): Card => {
  const mockCard: Partial<Card> = {
    getId: vi.fn(() => 'card-id-1'),
    getName: vi.fn(() => 'Test Card'),
    getTypes: vi.fn(() => new Set([CardType.ACTION])),
    getCost: vi.fn(() => Cost.Simple(3)),
    getLocation: vi.fn(() => CardLocation.PILE),
    isSimpleTreasure: vi.fn(() => false),
    isSupplyCard: vi.fn(() => true),
    canBeDiscardedInCleanup: vi.fn(() => true),
    ...overrides,
  };

  return mockCard as Card;
};

describe('StandardCardEligibilityFunctions', () => {
  describe('anyCard', () => {
    it('should match any card', () => {
      const card = createMockCard();
      expect(anyCard.matches(card)).toBe(true);
    });

    it('should match multiple different cards', () => {
      const card1 = createMockCard({ getName: vi.fn(() => 'Card 1') });
      const card2 = createMockCard({ getName: vi.fn(() => 'Card 2') });
      const card3 = createMockCard({ getName: vi.fn(() => 'Card 3') });

      expect(anyCard.matches(card1)).toBe(true);
      expect(anyCard.matches(card2)).toBe(true);
      expect(anyCard.matches(card3)).toBe(true);
    });
  });

  describe('noCard', () => {
    // BUG: NoCard is constructed with `() => true`, so it matches every card instead of none
    it('should not match any card', () => {
      const card = createMockCard();
      expect(noCard.matches(card)).toBe(false);
    });
  });

  describe('MatchesType - Card Type Predicates', () => {
    it('isActionCard should match action cards', () => {
      const actionCard = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION])),
      });
      expect(isActionCard.matches(actionCard)).toBe(true);
    });

    it('isActionCard should not match non-action cards', () => {
      const treasureCard = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.TREASURE])),
      });
      expect(isActionCard.matches(treasureCard)).toBe(false);
    });

    it('isTreasureCard should match treasure cards', () => {
      const treasureCard = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.TREASURE])),
      });
      expect(isTreasureCard.matches(treasureCard)).toBe(true);
    });

    it('isTreasureCard should not match non-treasure cards', () => {
      const actionCard = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION])),
      });
      expect(isTreasureCard.matches(actionCard)).toBe(false);
    });

    it('isVictoryCard should match victory cards', () => {
      const victoryCard = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.VICTORY])),
      });
      expect(isVictoryCard.matches(victoryCard)).toBe(true);
    });

    it('isVictoryCard should not match non-victory cards', () => {
      const actionCard = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION])),
      });
      expect(isVictoryCard.matches(actionCard)).toBe(false);
    });

    it('isCurseCard should match curse cards', () => {
      const curseCard = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.CURSE])),
      });
      expect(isCurseCard.matches(curseCard)).toBe(true);
    });

    it('isCurseCard should not match non-curse cards', () => {
      const actionCard = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION])),
      });
      expect(isCurseCard.matches(actionCard)).toBe(false);
    });

    it('isDurationCard should match duration cards', () => {
      const durationCard = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.DURATION])),
      });
      expect(isDurationCard.matches(durationCard)).toBe(true);
    });

    it('isDurationCard should not match non-duration cards', () => {
      const actionCard = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION])),
      });
      expect(isDurationCard.matches(actionCard)).toBe(false);
    });

    it('should match cards with multiple types including the target type', () => {
      const multiTypeCard = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION, CardType.TREASURE])),
      });
      expect(isActionCard.matches(multiTypeCard)).toBe(true);
      expect(isTreasureCard.matches(multiTypeCard)).toBe(true);
      expect(isVictoryCard.matches(multiTypeCard)).toBe(false);
    });
  });

  describe('isSimpleTreasure', () => {
    it('should match cards marked as simple treasure', () => {
      const treasureCard = createMockCard({
        isSimpleTreasure: vi.fn(() => true),
      });
      expect(isSimpleTreasure.matches(treasureCard)).toBe(true);
    });

    it('should not match cards not marked as simple treasure', () => {
      const nonTreasureCard = createMockCard({
        isSimpleTreasure: vi.fn(() => false),
      });
      expect(isSimpleTreasure.matches(nonTreasureCard)).toBe(false);
    });
  });

  describe('isSupplyCard', () => {
    it('should match cards marked as supply cards', () => {
      const supplyCard = createMockCard({
        isSupplyCard: vi.fn(() => true),
      });
      expect(isSupplyCard.matches(supplyCard)).toBe(true);
    });

    it('should not match cards not marked as supply cards', () => {
      const nonSupplyCard = createMockCard({
        isSupplyCard: vi.fn(() => false),
      });
      expect(isSupplyCard.matches(nonSupplyCard)).toBe(false);
    });
  });

  describe('costsUpTo', () => {
    it('should match cards that cost equal to the specified cost', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Simple(3)),
      });
      const upTo3 = costsUpTo(Cost.Simple(3));
      expect(upTo3.matches(card)).toBe(true);
    });

    it('should match cards that cost less than the specified cost', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Simple(2)),
      });
      const upTo3 = costsUpTo(Cost.Simple(3));
      expect(upTo3.matches(card)).toBe(true);
    });

    it('should not match cards that cost more than the specified cost', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Simple(4)),
      });
      const upTo3 = costsUpTo(Cost.Simple(3));
      expect(upTo3.matches(card)).toBe(false);
    });

    it('should handle costs with potions', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Potion(2)),
      });
      const upToPotion2 = costsUpTo(Cost.Potion(2));
      expect(upToPotion2.matches(card)).toBe(true);
    });

    it('should handle costs with debt', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Debt(3, 2)),
      });
      const upToDebt = costsUpTo(Cost.Debt(3, 2));
      expect(upToDebt.matches(card)).toBe(true);
    });

    it('should not match when card has higher potion cost', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Potion(3)),
      });
      const upToPotion2 = costsUpTo(Cost.Potion(2));
      expect(upToPotion2.matches(card)).toBe(false);
    });

    it('should not match when card has higher debt cost', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Debt(2, 3)),
      });
      const upToDebt = costsUpTo(Cost.Debt(2, 2));
      expect(upToDebt.matches(card)).toBe(false);
    });
  });

  describe('costsExactly', () => {
    it('should match cards that cost exactly the specified amount', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Simple(3)),
      });
      const exactly3 = costsExactly(Cost.Simple(3));
      expect(exactly3.matches(card)).toBe(true);
    });

    it('should not match cards that cost less', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Simple(2)),
      });
      const exactly3 = costsExactly(Cost.Simple(3));
      expect(exactly3.matches(card)).toBe(false);
    });

    it('should not match cards that cost more', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Simple(4)),
      });
      const exactly3 = costsExactly(Cost.Simple(3));
      expect(exactly3.matches(card)).toBe(false);
    });

    it('should handle costs with potions exactly', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Potion(2)),
      });
      const exactlyPotion2 = costsExactly(Cost.Potion(2));
      expect(exactlyPotion2.matches(card)).toBe(true);
    });

    it('should not match different potion costs', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Potion(2)),
      });
      const exactlyPotion1 = costsExactly(Cost.Potion(1));
      expect(exactlyPotion1.matches(card)).toBe(false);
    });

    it('should handle costs with debt exactly', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Debt(3, 2)),
      });
      const exactlyDebt = costsExactly(Cost.Debt(3, 2));
      expect(exactlyDebt.matches(card)).toBe(true);
    });

    it('should not match different debt costs', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Debt(3, 2)),
      });
      const differentDebt = costsExactly(Cost.Debt(3, 1));
      expect(differentDebt.matches(card)).toBe(false);
    });
  });

  describe('costsTheSameAs', () => {
    it('should match cards with the same cost as the reference card', () => {
      const refCard = createMockCard({
        getCost: vi.fn(() => Cost.Simple(4)),
      });
      const testCard = createMockCard({
        getCost: vi.fn(() => Cost.Simple(4)),
      });
      const sameAs = costsTheSameAsCard(refCard);
      expect(sameAs.matches(testCard)).toBe(true);
    });

    it('should not match cards with different cost', () => {
      const refCard = createMockCard({
        getCost: vi.fn(() => Cost.Simple(4)),
      });
      const testCard = createMockCard({
        getCost: vi.fn(() => Cost.Simple(3)),
      });
      const sameAs = costsTheSameAsCard(refCard);
      expect(sameAs.matches(testCard)).toBe(false);
    });

    it('should handle complex costs', () => {
      const refCard = createMockCard({
        getCost: vi.fn(() => Cost.Debt(2, 3)),
      });
      const testCard = createMockCard({
        getCost: vi.fn(() => Cost.Debt(2, 3)),
      });
      const sameAs = costsTheSameAsCard(refCard);
      expect(sameAs.matches(testCard)).toBe(true);
    });

    it('should not match cards with different complex costs', () => {
      const refCard = createMockCard({
        getCost: vi.fn(() => Cost.Debt(2, 3)),
      });
      const testCard = createMockCard({
        getCost: vi.fn(() => Cost.Debt(2, 4)),
      });
      const sameAs = costsTheSameAsCard(refCard);
      expect(sameAs.matches(testCard)).toBe(false);
    });

    it('should update when reference card cost changes', () => {
      const refCard = createMockCard({
        getCost: vi.fn(() => Cost.Simple(3)),
      });
      const testCard = createMockCard({
        getCost: vi.fn(() => Cost.Simple(3)),
      });
      const sameAs = costsTheSameAsCard(refCard);
      expect(sameAs.matches(testCard)).toBe(true);

      // Change reference card cost
      const mutableReferenceCard = refCard as unknown as { getCost: () => Cost };
      mutableReferenceCard.getCost = vi.fn(() => Cost.Simple(4));
      expect(sameAs.matches(testCard)).toBe(false);
    });
  });

  describe('cardNameIs', () => {
    it('should match cards with the exact name', () => {
      const card = createMockCard({
        getName: vi.fn(() => 'Copper'),
      });
      const copperFilter = cardNameIs('Copper');
      expect(copperFilter.matches(card)).toBe(true);
    });

    it('should not match cards with different names', () => {
      const card = createMockCard({
        getName: vi.fn(() => 'Silver'),
      });
      const copperFilter = cardNameIs('Copper');
      expect(copperFilter.matches(card)).toBe(false);
    });

    it('should be case-insensitive', () => {
      const card = createMockCard({
        getName: vi.fn(() => 'Copper'),
      });
      const copperFilter = cardNameIs('copper');
      expect(copperFilter.matches(card)).toBe(true);
    });

    it('should be case-insensitive in reverse', () => {
      const card = createMockCard({
        getName: vi.fn(() => 'copper'),
      });
      const copperFilter = cardNameIs('COPPER');
      expect(copperFilter.matches(card)).toBe(true);
    });

    it('should handle cards with mixed case names', () => {
      const card = createMockCard({
        getName: vi.fn(() => "Witch's Hut"),
      });
      const filter = cardNameIs("witch's hut");
      expect(filter.matches(card)).toBe(true);
    });

    it('should not match cards with partial names', () => {
      const card = createMockCard({
        getName: vi.fn(() => "Witch's Hut"),
      });
      const filter = cardNameIs('Witch');
      expect(filter.matches(card)).toBe(false);
    });
  });

  describe('isACopyOf', () => {
    it('should match cards with the same name as the reference card', () => {
      const refCard = createMockCard({
        getName: vi.fn(() => 'Copper'),
      });
      const testCard = createMockCard({
        getName: vi.fn(() => 'Copper'),
      });
      const copyOf = isACopyOf(refCard);
      expect(copyOf.matches(testCard)).toBe(true);
    });

    it('should match even if IDs are different', () => {
      const refCard = createMockCard({
        getId: vi.fn(() => 'card-1'),
        getName: vi.fn(() => 'Copper'),
      });
      const testCard = createMockCard({
        getId: vi.fn(() => 'card-2'),
        getName: vi.fn(() => 'Copper'),
      });
      const copyOf = isACopyOf(refCard);
      expect(copyOf.matches(testCard)).toBe(true);
    });

    it('should not match cards with different names', () => {
      const refCard = createMockCard({
        getName: vi.fn(() => 'Copper'),
      });
      const testCard = createMockCard({
        getName: vi.fn(() => 'Silver'),
      });
      const copyOf = isACopyOf(refCard);
      expect(copyOf.matches(testCard)).toBe(false);
    });

    it('should be case-insensitive', () => {
      const refCard = createMockCard({
        getName: vi.fn(() => 'COPPER'),
      });
      const testCard = createMockCard({
        getName: vi.fn(() => 'copper'),
      });
      const copyOf = isACopyOf(refCard);
      expect(copyOf.matches(testCard)).toBe(true);
    });

    it('should not match cards with partial names', () => {
      const refCard = createMockCard({
        getName: vi.fn(() => "Witch's Hut"),
      });
      const testCard = createMockCard({
        getName: vi.fn(() => 'Witch'),
      });
      const copyOf = isACopyOf(refCard);
      expect(copyOf.matches(testCard)).toBe(false);
    });
  });

  describe('isTheSameCardAs', () => {
    it('should match cards with the same ID', () => {
      const refCard = createMockCard({
        getId: vi.fn(() => 'card-123'),
      });
      const testCard = createMockCard({
        getId: vi.fn(() => 'card-123'),
      });
      const sameCard = isTheSameCardAs(refCard);
      expect(sameCard.matches(testCard)).toBe(true);
    });

    it('should not match cards with different IDs', () => {
      const refCard = createMockCard({
        getId: vi.fn(() => 'card-123'),
      });
      const testCard = createMockCard({
        getId: vi.fn(() => 'card-456'),
      });
      const sameCard = isTheSameCardAs(refCard);
      expect(sameCard.matches(testCard)).toBe(false);
    });

    it('should not match cards with the same name but different IDs', () => {
      const refCard = createMockCard({
        getId: vi.fn(() => 'card-123'),
        getName: vi.fn(() => 'Copper'),
      });
      const testCard = createMockCard({
        getId: vi.fn(() => 'card-456'),
        getName: vi.fn(() => 'Copper'),
      });
      const sameCard = isTheSameCardAs(refCard);
      expect(sameCard.matches(testCard)).toBe(false);
    });
  });

  describe('both', () => {
    it('should match cards that satisfy both predicates', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION])),
        getCost: vi.fn(() => Cost.Simple(3)),
      });
      const actionAnd3Cost = both(isActionCard, costsExactly(Cost.Simple(3)));
      expect(actionAnd3Cost.matches(card)).toBe(true);
    });

    it('should not match if first predicate fails', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.TREASURE])),
        getCost: vi.fn(() => Cost.Simple(3)),
      });
      const actionAnd3Cost = both(isActionCard, costsExactly(Cost.Simple(3)));
      expect(actionAnd3Cost.matches(card)).toBe(false);
    });

    it('should not match if second predicate fails', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION])),
        getCost: vi.fn(() => Cost.Simple(4)),
      });
      const actionAnd3Cost = both(isActionCard, costsExactly(Cost.Simple(3)));
      expect(actionAnd3Cost.matches(card)).toBe(false);
    });

    it('should not match if both predicates fail', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.TREASURE])),
        getCost: vi.fn(() => Cost.Simple(4)),
      });
      const actionAnd3Cost = both(isActionCard, costsExactly(Cost.Simple(3)));
      expect(actionAnd3Cost.matches(card)).toBe(false);
    });

    it('should chain multiple predicates', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION, CardType.TREASURE])),
        getCost: vi.fn(() => Cost.Simple(3)),
        isSupplyCard: vi.fn(() => true),
      });
      const complexFilter = both(both(isActionCard, isTreasureCard), isSupplyCard);
      expect(complexFilter.matches(card)).toBe(true);
    });

    it('should not match when chaining multiple predicates fails', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION])),
        getCost: vi.fn(() => Cost.Simple(3)),
        isSupplyCard: vi.fn(() => true),
      });
      const complexFilter = both(both(isActionCard, isTreasureCard), isSupplyCard);
      expect(complexFilter.matches(card)).toBe(false);
    });
  });

  describe('either', () => {
    it('should match cards that satisfy the first predicate', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION])),
      });
      const actionOrTreasure = either(isActionCard, isTreasureCard);
      expect(actionOrTreasure.matches(card)).toBe(true);
    });

    it('should match cards that satisfy the second predicate', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.TREASURE])),
      });
      const actionOrTreasure = either(isActionCard, isTreasureCard);
      expect(actionOrTreasure.matches(card)).toBe(true);
    });

    it('should match cards that satisfy both predicates', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION, CardType.TREASURE])),
      });
      const actionOrTreasure = either(isActionCard, isTreasureCard);
      expect(actionOrTreasure.matches(card)).toBe(true);
    });

    it('should not match cards that satisfy neither predicate', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.VICTORY])),
      });
      const actionOrTreasure = either(isActionCard, isTreasureCard);
      expect(actionOrTreasure.matches(card)).toBe(false);
    });

    it('should chain multiple predicates', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.CURSE])),
      });
      const actionOrTreasureOrCurse = either(either(isActionCard, isTreasureCard), isCurseCard);
      expect(actionOrTreasureOrCurse.matches(card)).toBe(true);
    });

    it('should not match when chaining multiple predicates and none succeed', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.VICTORY])),
      });
      const actionOrTreasureOrCurse = either(either(isActionCard, isTreasureCard), isCurseCard);
      expect(actionOrTreasureOrCurse.matches(card)).toBe(false);
    });
  });

  describe('isInLocation', () => {
    it('should match cards in the specified location', () => {
      const card = createMockCard({
        getLocation: vi.fn(() => CardLocation.HAND),
      });
      const inHand = isInLocation(CardLocation.HAND);
      expect(inHand.matches(card)).toBe(true);
    });

    it('should not match cards in different locations', () => {
      const card = createMockCard({
        getLocation: vi.fn(() => CardLocation.PILE),
      });
      const inHand = isInLocation(CardLocation.HAND);
      expect(inHand.matches(card)).toBe(false);
    });

    it('should handle all card locations', () => {
      const locations = [
        CardLocation.HAND,
        CardLocation.IN_PLAY,
        CardLocation.DISCARD,
        CardLocation.DECK,
        CardLocation.TRASH,
        CardLocation.PILE,
      ];

      for (const location of locations) {
        const card = createMockCard({
          getLocation: vi.fn(() => location),
        });
        const locFilter = isInLocation(location);
        expect(locFilter.matches(card)).toBe(true);
      }
    });

    it('should not match different locations when specified', () => {
      const allLocations = [
        CardLocation.HAND,
        CardLocation.IN_PLAY,
        CardLocation.DISCARD,
        CardLocation.DECK,
        CardLocation.TRASH,
        CardLocation.PILE,
      ];

      const inHand = isInLocation(CardLocation.HAND);

      for (const location of allLocations) {
        if (location === CardLocation.HAND) continue;
        const card = createMockCard({
          getLocation: vi.fn(() => location),
        });
        expect(inHand.matches(card)).toBe(false);
      }
    });
  });

  describe('canBeDiscardedInCleanup', () => {
    it('should match cards that can be discarded in cleanup', () => {
      const card = createMockCard({
        canBeDiscardedInCleanup: vi.fn(() => true),
      });
      expect(canBeDiscardedInCleanup.matches(card)).toBe(true);
    });

    it('should not match cards that cannot be discarded in cleanup', () => {
      const card = createMockCard({
        canBeDiscardedInCleanup: vi.fn(() => false),
      });
      expect(canBeDiscardedInCleanup.matches(card)).toBe(false);
    });

    it('should handle multiple cards with different cleanup states', () => {
      const discardableCard = createMockCard({
        canBeDiscardedInCleanup: vi.fn(() => true),
      });
      const nonDiscardableCard = createMockCard({
        canBeDiscardedInCleanup: vi.fn(() => false),
      });

      expect(canBeDiscardedInCleanup.matches(discardableCard)).toBe(true);
      expect(canBeDiscardedInCleanup.matches(nonDiscardableCard)).toBe(false);
    });
  });

  describe('Complex Predicate Combinations', () => {
    it('should combine predicates with both and either', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION])),
        getCost: vi.fn(() => Cost.Simple(3)),
        getLocation: vi.fn(() => CardLocation.HAND),
      });

      const actionCard3CostOrInHand = either(
        both(isActionCard, costsExactly(Cost.Simple(3))),
        isInLocation(CardLocation.HAND),
      );

      expect(actionCard3CostOrInHand.matches(card)).toBe(true);
    });

    it('should create deeply nested predicate combinations', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.ACTION, CardType.TREASURE])),
        getCost: vi.fn(() => Cost.Simple(2)),
        isSupplyCard: vi.fn(() => true),
        canBeDiscardedInCleanup: vi.fn(() => true),
      });

      const complexFilter = both(
        either(isActionCard, isTreasureCard),
        both(both(costsUpTo(Cost.Simple(3)), isSupplyCard), canBeDiscardedInCleanup),
      );

      expect(complexFilter.matches(card)).toBe(true);
    });

    it('should handle negative cases in complex combinations', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set([CardType.VICTORY])),
        getCost: vi.fn(() => Cost.Simple(5)),
      });

      const actionOrTreasureUpTo4Cost = both(either(isActionCard, isTreasureCard), costsUpTo(Cost.Simple(4)));

      expect(actionOrTreasureUpTo4Cost.matches(card)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero cost cards', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Simple(0)),
      });

      const upTo0 = costsUpTo(Cost.Simple(0));
      const exactly0 = costsExactly(Cost.Simple(0));

      expect(upTo0.matches(card)).toBe(true);
      expect(exactly0.matches(card)).toBe(true);
    });

    it('should handle high cost cards', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.Simple(100)),
      });

      const upTo100 = costsUpTo(Cost.Simple(100));
      const exactly100 = costsExactly(Cost.Simple(100));

      expect(upTo100.matches(card)).toBe(true);
      expect(exactly100.matches(card)).toBe(true);
    });

    it('should handle cards with empty type set', () => {
      const card = createMockCard({
        getTypes: vi.fn(() => new Set<CardType>()),
      });

      expect(isActionCard.matches(card)).toBe(false);
      expect(isTreasureCard.matches(card)).toBe(false);
      expect(isVictoryCard.matches(card)).toBe(false);
    });

    it('should handle empty string card names', () => {
      const card = createMockCard({
        getName: vi.fn(() => ''),
      });

      const emptyNameFilter = cardNameIs('');
      expect(emptyNameFilter.matches(card)).toBe(true);
    });

    it('should handle cards with special characters in names', () => {
      const card = createMockCard({
        getName: vi.fn(() => "Witch's Hut [III]"),
      });

      const filter = cardNameIs("witch's hut [iii]");
      expect(filter.matches(card)).toBe(true);
    });

    it('should handle costs with multiple components', () => {
      const card = createMockCard({
        getCost: vi.fn(() => Cost.fromCommonCost({ coins: 2, potions: 1, debt: 1, has_asterisk: false })),
      });

      // This test verifies the Cost constructor accepts multiple components
      expect(card.getCost()).toBeDefined();
    });
  });

  describe('additional card type predicates', () => {
    it.each([
      ['isAttackCard', isAttackCard, CardType.ATTACK],
      ['isCommandCard', isCommandCard, CardType.COMMAND],
      ['isKnightCard', isKnightCard, CardType.KNIGHT],
      ['isRuinsCard', isRuinsCard, CardType.RUINS],
      ['isShelterCard', isShelterCard, CardType.SHELTER],
      ['isRewardCard', isRewardCard, CardType.REWARD],
    ])('%s matches only cards with that type', (_name, predicate, type) => {
      const matchingCard = createMockCard({ getTypes: vi.fn(() => new Set([CardType.ACTION, type])) });
      const otherCard = createMockCard({ getTypes: vi.fn(() => new Set([CardType.ACTION])) });

      expect(predicate.matches(matchingCard)).toBe(true);
      expect(predicate.matches(otherCard)).toBe(false);
    });
  });

  describe('kingdom and expansion predicates', () => {
    const createKingdomCard = (expansion: Expansion): KingdomCard =>
      new KingdomCard({ cost: vi.fn(() => Cost.Simple(3)) } as unknown as SharedGameState, {
        category: CardCategory.CARD,
        name: 'Test Kingdom Card',
        text: '',
        font_size: 'small',
        cost: { coins: 3 },
        types: [CardType.ACTION],
        expansion,
      });

    it('isKingdomCard matches kingdom cards only', () => {
      expect(isKingdomCard.matches(createKingdomCard(Expansion.PROSPERITY))).toBe(true);
      expect(isKingdomCard.matches(createMockCard())).toBe(false);
    });

    it('isFromExpansion matches kingdom cards from that expansion only', () => {
      const prosperityCard = createKingdomCard(Expansion.PROSPERITY);

      expect(isFromExpansion(Expansion.PROSPERITY).matches(prosperityCard)).toBe(true);
      expect(isFromExpansion(Expansion.DARK_AGES).matches(prosperityCard)).toBe(false);
      expect(isFromExpansion(Expansion.PROSPERITY).matches(createMockCard())).toBe(false);
    });
  });

  describe('cost comparisons', () => {
    const cardCosting = (cost: Cost): Card => createMockCard({ getCost: vi.fn(() => cost) });

    it('costsAtLeast matches cards costing the same or more in every component', () => {
      const atLeast3 = costsAtLeast(Cost.Simple(3));

      expect(atLeast3.matches(cardCosting(Cost.Simple(3)))).toBe(true);
      expect(atLeast3.matches(cardCosting(Cost.Simple(5)))).toBe(true);
      expect(atLeast3.matches(cardCosting(Cost.Potion(3)))).toBe(true);
      expect(atLeast3.matches(cardCosting(Cost.Simple(2)))).toBe(false);
      expect(costsAtLeast(Cost.Potion(2)).matches(cardCosting(Cost.Simple(6)))).toBe(false);
    });

    it('costsLessThan matches strictly cheaper cards and never cards with a potion the bound lacks', () => {
      const lessThan5 = costsLessThan(Cost.Simple(5));

      expect(lessThan5.matches(cardCosting(Cost.Simple(4)))).toBe(true);
      expect(lessThan5.matches(cardCosting(Cost.Simple(5)))).toBe(false);
      expect(lessThan5.matches(cardCosting(Cost.Potion(2)))).toBe(false);
    });

    it('costsLessThanCard compares against the other card cost when evaluated', () => {
      const referenceCost = { current: Cost.Simple(5) };
      const reference = createMockCard({ getCost: vi.fn(() => referenceCost.current) });
      const cheaperThanReference = costsLessThanCard(reference);

      expect(cheaperThanReference.matches(cardCosting(Cost.Simple(4)))).toBe(true);
      expect(cheaperThanReference.matches(cardCosting(Cost.Simple(5)))).toBe(false);

      referenceCost.current = Cost.Simple(4);
      expect(cheaperThanReference.matches(cardCosting(Cost.Simple(4)))).toBe(false);
    });

    it('costsBetween includes both bounds', () => {
      const between3And5 = costsBetween(Cost.Simple(3), Cost.Simple(5));

      expect(between3And5.matches(cardCosting(Cost.Simple(2)))).toBe(false);
      expect(between3And5.matches(cardCosting(Cost.Simple(3)))).toBe(true);
      expect(between3And5.matches(cardCosting(Cost.Simple(5)))).toBe(true);
      expect(between3And5.matches(cardCosting(Cost.Simple(6)))).toBe(false);
    });

    it('costsTheSameOrLessThanCard includes cards costing exactly the same', () => {
      const reference = cardCosting(Cost.Potion(3));
      const upToReference = costsTheSameOrLessThanCard(reference);

      expect(upToReference.matches(cardCosting(Cost.Potion(3)))).toBe(true);
      expect(upToReference.matches(cardCosting(Cost.Simple(3)))).toBe(true);
      expect(upToReference.matches(cardCosting(Cost.Simple(4)))).toBe(false);
    });

    it('costsExactlyNMoreThanCard matches only the exact coin difference with the same potions', () => {
      const reference = cardCosting(Cost.Simple(3));
      const exactlyOneMore = costsExactlyNMoreThanCard(reference, 1);

      expect(exactlyOneMore.matches(cardCosting(Cost.Simple(4)))).toBe(true);
      expect(exactlyOneMore.matches(cardCosting(Cost.Simple(3)))).toBe(false);
      expect(exactlyOneMore.matches(cardCosting(Cost.Simple(5)))).toBe(false);
      expect(exactlyOneMore.matches(cardCosting(Cost.Potion(4)))).toBe(false);
    });

    it('costsUpToNMoreThanCard matches anything up to the raised cost', () => {
      const upToTwoMore = costsUpToNMoreThanCard(cardCosting(Cost.Simple(3)), 2);

      expect(upToTwoMore.matches(cardCosting(Cost.Simple(0)))).toBe(true);
      expect(upToTwoMore.matches(cardCosting(Cost.Simple(5)))).toBe(true);
      expect(upToTwoMore.matches(cardCosting(Cost.Simple(6)))).toBe(false);
      expect(upToTwoMore.matches(cardCosting(Cost.Potion(2)))).toBe(false);
    });

    it('costsExactlyNLessThanCard matches only the exact coin difference with the same potions and debt', () => {
      const reference = cardCosting(Cost.Potion(4));
      const exactlyOneLess = costsExactlyNLessThanCard(reference, 1);

      expect(exactlyOneLess.matches(cardCosting(Cost.Potion(3)))).toBe(true);
      expect(exactlyOneLess.matches(cardCosting(Cost.Simple(3)))).toBe(false);
      expect(exactlyOneLess.matches(cardCosting(Cost.Potion(2)))).toBe(false);
      expect(costsExactlyNLessThanCard(cardCosting(Cost.Simple(0)), 1).matches(cardCosting(Cost.Simple(0)))).toBe(
        false,
      );
    });
  });

  describe('not', () => {
    it('inverts the wrapped predicate', () => {
      const actionCard = createMockCard({ getTypes: vi.fn(() => new Set([CardType.ACTION])) });
      const treasureCard = createMockCard({ getTypes: vi.fn(() => new Set([CardType.TREASURE])) });

      expect(not(isActionCard).matches(actionCard)).toBe(false);
      expect(not(isActionCard).matches(treasureCard)).toBe(true);
    });
  });

  describe('isDuplicateWith', () => {
    // BUG: IsDuplicateWith checks `numMatchingCards(isACopyOf(c)) === 0`, so it matches cards with no copy in the collection
    it('matches cards that have a copy in the collection', () => {
      const hand = CardCollection.fromCards([
        createMockCard({ getId: vi.fn(() => 'copper-hand'), getName: vi.fn(() => 'Copper') }),
      ]);
      const duplicateOfHand = isDuplicateWith(hand);

      expect(
        duplicateOfHand.matches(createMockCard({ getId: vi.fn(() => 'copper-deck'), getName: vi.fn(() => 'Copper') })),
      ).toBe(true);
      expect(
        duplicateOfHand.matches(createMockCard({ getId: vi.fn(() => 'silver-deck'), getName: vi.fn(() => 'Silver') })),
      ).toBe(false);
    });
  });
});
