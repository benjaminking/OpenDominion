import { CardCategory, CardType, Expansion, RandomizerRequirements } from '@dominion/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CardInfoLookup } from '../src/CardInfoLookup';

// Collects every randomizer name that satisfies the requirements by excluding each match in turn.
const allMatchingRandomizerNames = (randomizerRequirements?: RandomizerRequirements): Set<string> => {
  const usedCardNames = new Set<string>();
  for (;;) {
    const name = CardInfoLookup.findMatchingRandomizerName(randomizerRequirements, usedCardNames);
    if (name === undefined) {
      return usedCardNames;
    }
    usedCardNames.add(name);
  }
};

const kingdomCardInfos = () => CardInfoLookup.getKingdomCardNames().map((name) => CardInfoLookup.lookUpCardInfo(name));

const isPureCoinCost = (name: string, coins: number): boolean => {
  const { cost } = CardInfoLookup.lookUpCardInfo(name);
  return cost.coins === coins && !cost.potions && !cost.debt;
};

describe('CardInfoLookup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('lookUpCardInfo', () => {
    it('returns the card info of cards from the loaded expansions', () => {
      expect(CardInfoLookup.lookUpCardInfo('Village')).toMatchObject({
        name: 'Village',
        expansion: Expansion.BASE,
        cost: { coins: 3 },
        has_randomizer: true,
      });
      expect(CardInfoLookup.lookUpCardInfo('Hermit')).toMatchObject({ name: 'Hermit', expansion: Expansion.DARK_AGES });
      expect(CardInfoLookup.lookUpCardInfo('Joust').expansion).toBe(Expansion.CORNUCOPIA_AND_GUILDS);
      expect(CardInfoLookup.lookUpCardInfo('Copper').has_randomizer).toBeFalsy();
    });

    it('returns randomizer-only card info for piles made of several different cards', () => {
      expect(CardInfoLookup.lookUpCardInfo('Knights')).toMatchObject({
        name: 'Knights',
        category: CardCategory.RANDOMIZER_ONLY,
        has_randomizer: true,
      });
    });

    it('reports the shared pile name of cards that live in a mixed pile', () => {
      expect(CardInfoLookup.lookUpCardInfo('Dame Anna').pileNameOverride).toBe('Knights');
      expect(CardInfoLookup.lookUpCardInfo('Survivors').pileNameOverride).toBe('Ruins');
      expect(CardInfoLookup.lookUpCardInfo('Coronet').pileNameOverride).toBe('Rewards');
      expect(CardInfoLookup.lookUpCardInfo('Village').pileNameOverride).toBeUndefined();
    });

    it('throws for unknown cards and for cards from expansions that are not loaded', () => {
      expect(() => CardInfoLookup.lookUpCardInfo('Not A Card')).toThrow(
        'Requested card info for unknown card: Not A Card',
      );
      expect(() => CardInfoLookup.lookUpCardInfo('Encampment')).toThrow(
        'Requested card info for unknown card: Encampment',
      );
    });
  });

  describe('card name lists', () => {
    it('lists every loaded card name in sorted order', () => {
      const allCardNames = CardInfoLookup.getAllCardNames();

      expect(allCardNames).toEqual([...allCardNames].sort());
      expect(allCardNames).toEqual(expect.arrayContaining(['Copper', 'Village', 'Dame Anna', 'Knights', 'Spoils']));
      expect(allCardNames).not.toContain('Encampment');
    });

    it('lists only cards that have a randomizer as kingdom cards, in sorted order', () => {
      const kingdomCardNames = CardInfoLookup.getKingdomCardNames();

      expect(kingdomCardNames).toEqual([...kingdomCardNames].sort());
      expect(kingdomCardNames).toEqual(expect.arrayContaining(['Village', 'Hermit', 'Joust', 'Knights']));
      for (const name of ['Copper', 'Province', 'Dame Anna', 'Abandoned Mine', 'Spoils', 'Madman', 'Coronet']) {
        expect(kingdomCardNames).not.toContain(name);
      }
      expect(kingdomCardInfos().every((cardInfo) => cardInfo.has_randomizer === true)).toBe(true);
    });
  });

  describe('findMatchingRandomizerName', () => {
    it('chooses among all kingdom randomizers when there are no requirements', () => {
      const kingdomCardNames = new Set(CardInfoLookup.getKingdomCardNames());

      expect(allMatchingRandomizerNames()).toEqual(kingdomCardNames);
      expect(allMatchingRandomizerNames({})).toEqual(kingdomCardNames);
      expect(allMatchingRandomizerNames({ requiredExpansions: [], requiredCoinCosts: [], requiredTypes: [] })).toEqual(
        kingdomCardNames,
      );
    });

    it('uses Math.random to pick one of the matching randomizers', () => {
      const randomSpy = vi.spyOn(Math, 'random');
      randomSpy.mockReturnValue(0);
      const first = CardInfoLookup.findMatchingRandomizerName();
      randomSpy.mockReturnValue(0.9999);
      const last = CardInfoLookup.findMatchingRandomizerName();

      expect(first).toBeDefined();
      expect(last).toBeDefined();
      expect(first).not.toBe(last);
      expect(randomSpy).toHaveBeenCalledTimes(2);
    });

    it('only chooses randomizers from a required expansion', () => {
      const darkAgesRandomizers = allMatchingRandomizerNames({ requiredExpansions: [Expansion.DARK_AGES] });

      expect(darkAgesRandomizers).toEqual(
        new Set(
          kingdomCardInfos()
            .filter((cardInfo) => cardInfo.expansion === Expansion.DARK_AGES)
            .map((cardInfo) => cardInfo.name),
        ),
      );
      expect(darkAgesRandomizers.has('Knights')).toBe(true);
      expect(darkAgesRandomizers.has('Hermit')).toBe(true);
      expect(darkAgesRandomizers.has('Dame Anna')).toBe(false);
    });

    it('only chooses randomizers with a required coin cost and no potion or debt cost', () => {
      const twoCostRandomizers = allMatchingRandomizerNames({ requiredCoinCosts: [2] });

      expect(twoCostRandomizers).toEqual(
        new Set(CardInfoLookup.getKingdomCardNames().filter((name) => isPureCoinCost(name, 2))),
      );
      expect(twoCostRandomizers.has('Herbalist')).toBe(true);
      expect(twoCostRandomizers.has('Apothecary')).toBe(false);
    });

    it('only chooses randomizers that have every required type', () => {
      const attackRandomizers = allMatchingRandomizerNames({ requiredTypes: [CardType.ACTION, CardType.ATTACK] });

      expect(attackRandomizers).toEqual(
        new Set(
          kingdomCardInfos()
            .filter((cardInfo) => cardInfo.types.includes(CardType.ACTION) && cardInfo.types.includes(CardType.ATTACK))
            .map((cardInfo) => cardInfo.name),
        ),
      );
      expect(attackRandomizers.has('Militia')).toBe(true);
      expect(attackRandomizers.has('Village')).toBe(false);
    });

    it('combines expansion, cost and type requirements', () => {
      const matches = allMatchingRandomizerNames({
        requiredExpansions: [Expansion.BASE],
        requiredCoinCosts: [5],
        requiredTypes: [CardType.ATTACK],
      });

      expect(matches.size).toBeGreaterThan(0);
      for (const name of matches) {
        const cardInfo = CardInfoLookup.lookUpCardInfo(name);
        expect(cardInfo.expansion).toBe(Expansion.BASE);
        expect(isPureCoinCost(name, 5)).toBe(true);
        expect(cardInfo.types).toContain(CardType.ATTACK);
      }
      expect(matches.has('Witch')).toBe(true);
    });

    it('never chooses a used card name and returns undefined once every match is used', () => {
      const darkAgesTwoCosts = allMatchingRandomizerNames({
        requiredExpansions: [Expansion.DARK_AGES],
        requiredCoinCosts: [2],
      });
      const usedCardNames = new Set([...darkAgesTwoCosts].slice(1));

      expect(darkAgesTwoCosts.size).toBeGreaterThan(1);
      expect(
        CardInfoLookup.findMatchingRandomizerName(
          { requiredExpansions: [Expansion.DARK_AGES], requiredCoinCosts: [2] },
          usedCardNames,
        ),
      ).toBe([...darkAgesTwoCosts][0]);
      expect(
        CardInfoLookup.findMatchingRandomizerName(
          { requiredExpansions: [Expansion.DARK_AGES], requiredCoinCosts: [2] },
          darkAgesTwoCosts,
        ),
      ).toBeUndefined();
      expect(usedCardNames.size).toBe(darkAgesTwoCosts.size - 1);
    });

    it('returns undefined when the requirements exclude every randomizer', () => {
      expect(
        CardInfoLookup.findMatchingRandomizerName({
          requiredExpansions: [Expansion.BASE],
          requiredTypes: [CardType.RUINS],
        }),
      ).toBeUndefined();
    });

    // BUG: multiple required coin costs are intersected, so "costs $2 or $3" (Young Witch's Bane) never matches
    it('chooses a randomizer costing any one of several required coin costs', () => {
      const matches = allMatchingRandomizerNames({ requiredCoinCosts: [2, 3] });

      expect(matches).toEqual(
        new Set(
          CardInfoLookup.getKingdomCardNames().filter((name) => isPureCoinCost(name, 2) || isPureCoinCost(name, 3)),
        ),
      );
      expect(matches.has('Herbalist')).toBe(true);
      expect(matches.has('Village')).toBe(true);
    });

    // BUG: a requirement that no loaded card satisfies crashes on an undefined index set instead of returning undefined
    it('returns undefined for requirements that no loaded card can satisfy', () => {
      expect(CardInfoLookup.findMatchingRandomizerName({ requiredCoinCosts: [99] })).toBeUndefined();
      expect(CardInfoLookup.findMatchingRandomizerName({ requiredExpansions: [Expansion.EMPIRES] })).toBeUndefined();
      expect(CardInfoLookup.findMatchingRandomizerName({ requiredTypes: [CardType.LIAISON] })).toBeUndefined();
    });
  });
});
