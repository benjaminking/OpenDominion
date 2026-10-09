import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, CardInfo, CardType, Expansion, PileCategory } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { PileFactory } from '../../src/piles/PileFactory';
import { SpecialPileLookup, SpecialPileType } from '../../src/piles/SpecialPiles';

const rewardNames = ['Coronet', 'Courser', 'Demesne', 'Housecarl', 'Huge Turnip', 'Renown'];
const knightNames = [
  'Dame Anna',
  'Dame Josephine',
  'Dame Molly',
  'Dame Natalie',
  'Dame Sylvia',
  'Sir Bailey',
  'Sir Destry',
  'Sir Martin',
  'Sir Michael',
  'Sir Vander',
];
const ruinsNames = ['Abandoned Mine', 'Ruined Library', 'Ruined Market', 'Ruined Village', 'Survivors'];

const countByName = (names: string[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const name of names) {
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
};

const namesOf = (cardInfos: CardInfo[]) => cardInfos.map((cardInfo) => cardInfo.name);

const createPileFactory = (numPlayers: number) =>
  new PileFactory(
    {
      cost: vi.fn((card: Card) => card.getOriginalCost()),
      registerEffectTrigger: vi.fn(),
      getNumPlayers: () => numPlayers,
    } as unknown as SharedGameState,
    { sendPileMetadata: vi.fn(), updateSharedCards: vi.fn() } as unknown as GameMessageBroadcaster,
  );

describe('SpecialPileLookup', () => {
  const lookup = new SpecialPileLookup();

  it('defines the Rewards pile as two of each of the six Rewards, unshuffled, outside the Supply', () => {
    const specification = lookup.lookUpSpecialPile(SpecialPileType.REWARDS);

    expect(specification.pileName).toBe('Rewards');
    expect(countByName(namesOf(specification.cardInfos))).toEqual(
      Object.fromEntries(rewardNames.map((name) => [name, 2])),
    );
    expect(specification.pileCategories).toEqual(new Set([PileCategory.NON_SUPPLY]));
    expect(specification.isShuffled).toBe(false);
    expect(specification.randomizerCardInfo).toMatchObject({
      name: 'Rewards',
      category: CardCategory.CARD,
      expansion: Expansion.CORNUCOPIA_AND_GUILDS,
      has_randomizer: false,
    });
    for (const cardInfo of specification.cardInfos) {
      expect(cardInfo).toBe(CardInfoLookup.lookUpCardInfo(cardInfo.name));
      expect(cardInfo.types).toContain(CardType.REWARD);
      expect(cardInfo.pileNameOverride).toBe('Rewards');
    }
  });

  it('defines the Knights pile as one of each of the ten Knights, shuffled, in the Kingdom', () => {
    const specification = lookup.lookUpSpecialPile(SpecialPileType.KNIGHTS);

    expect(specification.pileName).toBe('Knights');
    expect(namesOf(specification.cardInfos).sort()).toEqual(knightNames);
    expect(specification.pileCategories).toEqual(new Set([PileCategory.SUPPLY, PileCategory.KINGDOM]));
    expect(specification.isShuffled).toBe(true);
    expect(specification.randomizerCardInfo).toBe(CardInfoLookup.lookUpCardInfo('Knights'));
    for (const cardInfo of specification.cardInfos) {
      expect(cardInfo.types).toContain(CardType.KNIGHT);
      expect(cardInfo.pileNameOverride).toBe('Knights');
    }
  });

  it('defines the Ruins pile as ten of each of the five Ruins, shuffled, in the Supply but not the Kingdom', () => {
    const specification = lookup.lookUpSpecialPile(SpecialPileType.RUINS);

    expect(specification.pileName).toBe('Ruins');
    expect(countByName(namesOf(specification.cardInfos))).toEqual(
      Object.fromEntries(ruinsNames.map((name) => [name, 10])),
    );
    expect(specification.pileCategories).toEqual(new Set([PileCategory.SUPPLY]));
    expect(specification.isShuffled).toBe(true);
    expect(specification.randomizerCardInfo).toMatchObject({
      name: 'Ruins',
      cost: { coins: 0 },
      types: [CardType.ACTION, CardType.RUINS],
      expansion: Expansion.DARK_AGES,
      has_randomizer: false,
    });
    for (const cardInfo of specification.cardInfos) {
      expect(cardInfo.types).toContain(CardType.RUINS);
      expect(cardInfo.pileNameOverride).toBe('Ruins');
    }
  });

  it('returns an independent specification for each lookup', () => {
    const first = lookup.lookUpSpecialPile(SpecialPileType.RUINS);
    first.pileCategories.add(PileCategory.KINGDOM);
    first.cardInfos.pop();

    const second = lookup.lookUpSpecialPile(SpecialPileType.RUINS);

    expect(second.pileCategories).toEqual(new Set([PileCategory.SUPPLY]));
    expect(second.cardInfos).toHaveLength(50);
  });

  it('throws for an unknown special pile type', () => {
    expect(() => lookup.lookUpSpecialPile('Not A Pile' as SpecialPileType)).toThrow(
      'Tried to construct an unknown special pile: Not A Pile',
    );
  });
});

describe('special piles created by PileFactory', () => {
  const lookup = new SpecialPileLookup();

  it('creates a 12-card Rewards pile whose cards all belong to the Rewards pile', () => {
    for (const numPlayers of [2, 4]) {
      const pile = createPileFactory(numPlayers).createSpecialPile(lookup.lookUpSpecialPile(SpecialPileType.REWARDS));

      expect(pile.name).toBe('Rewards');
      expect(pile.size()).toBe(12);
      expect(countByName(pile.toCardNameArray())).toEqual(Object.fromEntries(rewardNames.map((name) => [name, 2])));
      expect(pile.asCardArray().every((card) => card.getPileName() === 'Rewards')).toBe(true);
      expect(pile.getCategories()).toEqual(new Set([PileCategory.NON_SUPPLY]));
    }
  });

  it('creates a Knights pile with every Knight exactly once regardless of player count', () => {
    for (const numPlayers of [2, 3, 4]) {
      const pile = createPileFactory(numPlayers).createSpecialPile(lookup.lookUpSpecialPile(SpecialPileType.KNIGHTS));

      expect(pile.name).toBe('Knights');
      expect(pile.size()).toBe(10);
      expect([...pile.toCardNameArray()].sort()).toEqual(knightNames);
      expect(pile.asCardArray().every((card) => card.getPileName() === 'Knights')).toBe(true);
      expect(pile.asCardArray().every((card) => card.hasType(CardType.KNIGHT))).toBe(true);
      expect(pile.getTypes()).toEqual(new Set(CardInfoLookup.lookUpCardInfo('Knights').types));
      expect(pile.getCategories()).toEqual(new Set([PileCategory.SUPPLY, PileCategory.KINGDOM]));
    }
  });

  it.each([
    [2, 10],
    [3, 20],
    [4, 30],
  ])('creates a Ruins pile of %i-player size with uniquely identified Ruins', (numPlayers, size) => {
    const pile = createPileFactory(numPlayers).createSpecialPile(lookup.lookUpSpecialPile(SpecialPileType.RUINS));

    expect(pile.name).toBe('Ruins');
    expect(pile.size()).toBe(size);
    expect(pile.originalSize).toBe(size);
    expect(pile.toCardNameArray().every((name) => ruinsNames.includes(name))).toBe(true);
    expect(pile.asCardArray().every((card) => card.getPileName() === 'Ruins')).toBe(true);
    expect(new Set(pile.asCardArray().map((card) => card.getId())).size).toBe(size);
    expect(pile.getCategories()).toEqual(new Set([PileCategory.SUPPLY]));
  });

  it('shuffles all fifty Ruins before choosing the ones in the pile', () => {
    const pile = createPileFactory(2).createSpecialPile(lookup.lookUpSpecialPile(SpecialPileType.RUINS));

    expect(new Set(pile.toCardNameArray()).size).toBeGreaterThan(1);
  });
});
