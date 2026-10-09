import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, CardInfo, CardLocation, CardType, Expansion, PileCategory } from '@dominion/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { PileFactory } from '../../src/piles/PileFactory';
import { SpecialPileLookup, SpecialPileSpecification, SpecialPileType } from '../../src/piles/SpecialPiles';

const createSharedGameStateMock = (numPlayers = 2) => {
  return {
    cost: vi.fn((card: Card) => card.getOriginalCost()),
    registerEffectTrigger: vi.fn(),
    getNumPlayers: vi.fn(() => numPlayers),
  } as unknown as SharedGameState;
};

const createBroadcaster = () => {
  return {
    sendPileMetadata: vi.fn(),
    updateSharedCards: vi.fn(),
  } as unknown as GameMessageBroadcaster;
};

const createPileFactory = (numPlayers = 2) =>
  new PileFactory(createSharedGameStateMock(numPlayers), createBroadcaster());

const estateInfo: CardInfo = {
  name: 'Estate',
  category: CardCategory.CARD,
  text: '1 VP',
  font_size: 'small',
  cost: {
    coins: 2,
    potions: 0,
    debt: 0,
  },
  types: [CardType.VICTORY],
  expansion: Expansion.BASE,
  mechanics: [],
};

const createSpecification = (
  cardNames: string[],
  overrides: Partial<SpecialPileSpecification> = {},
): SpecialPileSpecification => ({
  pileName: 'Test Pile',
  randomizerCardInfo: CardInfoLookup.lookUpCardInfo('Village'),
  cardInfos: cardNames.map((cardName) => CardInfoLookup.lookUpCardInfo(cardName)),
  pileCategories: new Set([PileCategory.SUPPLY, PileCategory.KINGDOM]),
  isShuffled: false,
  ...overrides,
});

describe('PileFactory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPile', () => {
    it('creates a pile with supply cards using pile-specific ids and locations', () => {
      const pileFactory = createPileFactory(2);

      const pile = pileFactory.createPile(estateInfo, new Set([PileCategory.BASIC_VICTORY]));

      expect(pile.name).toBe('Estate');
      expect(pile.originalSize).toBe(8);
      expect(pile.size()).toBe(8);
      expect(pile.getPileMetadata()).toEqual({
        name: 'Estate',
        size: 8,
        originalCost: {
          coins: 2,
          potions: 0,
          debt: 0,
          has_asterisk: false,
        },
        cost: {
          coins: 2,
          potions: 0,
          debt: 0,
          has_asterisk: false,
        },
        topCard: expect.objectContaining({
          name: 'Estate',
          id: 'Estate_pile_7',
          location: CardLocation.PILE,
          types: [CardType.VICTORY],
        }),
        types: [CardType.VICTORY],
        categories: [PileCategory.BASIC_VICTORY],
      });
    });

    it('marks every created card as a supply card', () => {
      const pileFactory = createPileFactory(2);

      const pile = pileFactory.createPile(estateInfo, new Set([PileCategory.KINGDOM, PileCategory.SUPPLY]));
      const firstCard = pile.removeTopCard();
      const secondCard = pile.removeTopCard();

      expect(firstCard.isSupplyCard()).toBe(true);
      expect(secondCard.isSupplyCard()).toBe(true);
      expect(firstCard.getId()).toBe('Estate_pile_7');
      expect(secondCard.getId()).toBe('Estate_pile_6');
      expect(pile.asCardArray().every((card) => card.isSupplyCard())).toBe(true);
    });

    it.each([
      [2, 8, 10],
      [3, 12, 20],
      [4, 12, 30],
    ])('sizes victory and curse piles for %i players', (numPlayers, victoryPileSize, cursePileSize) => {
      const pileFactory = createPileFactory(numPlayers);

      expect(pileFactory.createPile(estateInfo, new Set([PileCategory.BASIC_VICTORY])).size()).toBe(victoryPileSize);
      expect(
        pileFactory.createPile(CardInfoLookup.lookUpCardInfo('Gardens'), new Set([PileCategory.KINGDOM])).size(),
      ).toBe(victoryPileSize);
      expect(
        pileFactory.createPile(CardInfoLookup.lookUpCardInfo('Curse'), new Set([PileCategory.BASIC_VICTORY])).size(),
      ).toBe(cursePileSize);
    });

    it('creates ten-card kingdom piles and fixed-size treasure piles', () => {
      const pileFactory = createPileFactory(3);
      const sizeOf = (cardName: string) =>
        pileFactory.createPile(CardInfoLookup.lookUpCardInfo(cardName), new Set([PileCategory.SUPPLY])).size();

      expect(sizeOf('Village')).toBe(10);
      expect(sizeOf('Silver')).toBe(40);
      expect(sizeOf('Gold')).toBe(30);
      expect(sizeOf('Potion')).toBe(16);
    });

    it('creates Platinum and Colony piles for games using them', () => {
      const pileFactory = createPileFactory(2);

      const platinumPile = pileFactory.createPile(
        CardInfoLookup.lookUpCardInfo('Platinum'),
        new Set([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]),
      );
      const colonyPile = pileFactory.createPile(
        CardInfoLookup.lookUpCardInfo('Colony'),
        new Set([PileCategory.BASIC_VICTORY, PileCategory.SUPPLY]),
      );

      expect(platinumPile.size()).toBe(12);
      expect(colonyPile.size()).toBe(8);
    });

    it('creates cards of the requested card with the card info types and the given categories', () => {
      const pileFactory = createPileFactory(2);
      const categories = new Set([PileCategory.KINGDOM, PileCategory.SUPPLY]);

      const pile = pileFactory.createPile(CardInfoLookup.lookUpCardInfo('Bandit Camp'), categories);

      expect(pile.name).toBe('Bandit Camp');
      expect(pile.getCategories()).toBe(categories);
      expect(pile.getTypes()).toEqual(new Set(CardInfoLookup.lookUpCardInfo('Bandit Camp').types));
      expect(new Set(pile.toCardNameArray())).toEqual(new Set(['Bandit Camp']));
      expect(pile.asCardArray().map((card) => card.getId())).toEqual(
        Array.from({ length: 10 }, (_, index) => `Bandit Camp_pile_${String(index)}`),
      );
      expect(pile.asCardArray().every((card) => card.getLocation() === CardLocation.PILE)).toBe(true);
    });
  });

  describe('createSpecialPile', () => {
    it('creates a pile named after the specification with its categories and randomizer types', () => {
      const pileFactory = createPileFactory(2);
      const specification = createSpecification(['Smithy', 'Smithy', 'Smithy', 'Moat', 'Moat'], {
        randomizerCardInfo: CardInfoLookup.lookUpCardInfo('Militia'),
        pileCategories: new Set([PileCategory.SUPPLY]),
      });

      const pile = pileFactory.createSpecialPile(specification);

      expect(pile.name).toBe('Test Pile');
      expect(pile.getCategories()).toBe(specification.pileCategories);
      expect(pile.getTypes()).toEqual(new Set([CardType.ACTION, CardType.ATTACK]));
      expect(pile.size()).toBe(5);
      expect(pile.originalSize).toBe(5);
    });

    it('numbers card ids separately for each card name and places every card in the pile', () => {
      const pileFactory = createPileFactory(2);

      const pile = pileFactory.createSpecialPile(createSpecification(['Smithy', 'Moat', 'Smithy', 'Moat', 'Smithy']));

      expect(
        pile
          .asCardArray()
          .map((card) => card.getId())
          .sort(),
      ).toEqual(['Moat_pile_1', 'Moat_pile_2', 'Smithy_pile_1', 'Smithy_pile_2', 'Smithy_pile_3']);
      expect(pile.asCardArray().every((card) => card.getLocation() === CardLocation.PILE)).toBe(true);
      expect(pile.asCardArray().every((card) => card.isSupplyCard())).toBe(true);
    });

    it('trims the pile to the size of the randomizer pile', () => {
      const pileFactory = createPileFactory(2);

      const actionPile = pileFactory.createSpecialPile(createSpecification(Array<string>(14).fill('Smithy')));
      const victoryPile = pileFactory.createSpecialPile(
        createSpecification(Array<string>(14).fill('Gardens'), {
          randomizerCardInfo: CardInfoLookup.lookUpCardInfo('Gardens'),
        }),
      );

      expect(actionPile.size()).toBe(10);
      expect(victoryPile.size()).toBe(8);
    });

    it('shuffles the cards of a shuffled pile but not of an unshuffled one', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const pileFactory = createPileFactory(2);
      const cardNames = ['Cellar', 'Moat', 'Village', 'Smithy', 'Market'];

      const unshuffledPile = pileFactory.createSpecialPile(createSpecification(cardNames));
      const secondUnshuffledPile = pileFactory.createSpecialPile(createSpecification(cardNames));
      const shuffledPile = pileFactory.createSpecialPile(createSpecification(cardNames, { isShuffled: true }));

      expect(secondUnshuffledPile.toCardNameArray()).toEqual(unshuffledPile.toCardNameArray());
      expect(shuffledPile.toCardNameArray()).not.toEqual(unshuffledPile.toCardNameArray());
      expect([...shuffledPile.toCardNameArray()].sort()).toEqual([...cardNames].sort());
    });

    it('creates the Rewards special pile from the special pile lookup', () => {
      const pileFactory = createPileFactory(2);

      const pile = pileFactory.createSpecialPile(new SpecialPileLookup().lookUpSpecialPile(SpecialPileType.REWARDS));

      expect(pile.name).toBe('Rewards');
      expect(pile.size()).toBe(12);
      expect(pile.getCategories()).toEqual(new Set([PileCategory.NON_SUPPLY]));
    });
  });

  it('does not mark cards in non-supply piles as supply cards', () => {
    const pileFactory = createPileFactory(2);

    const spoilsPile = pileFactory.createPile(
      CardInfoLookup.lookUpCardInfo('Spoils'),
      new Set([PileCategory.NON_SUPPLY]),
    );
    const rewardsPile = pileFactory.createSpecialPile(
      new SpecialPileLookup().lookUpSpecialPile(SpecialPileType.REWARDS),
    );

    expect(spoilsPile.size()).toBe(15);
    expect(spoilsPile.asCardArray().some((card) => card.isSupplyCard())).toBe(false);
    expect(rewardsPile.asCardArray().some((card) => card.isSupplyCard())).toBe(false);
  });
});
