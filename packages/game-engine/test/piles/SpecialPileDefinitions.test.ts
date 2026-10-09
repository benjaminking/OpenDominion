import { CardCategory, CardInfo, CardType, Expansion, PileCategory } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Cost } from '../../src/card/Cost';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { convertToClassName } from '../../src/NameUtils';
import { PileFactory } from '../../src/piles/PileFactory';
import { SpecialPileLookup, SpecialPileType } from '../../src/piles/SpecialPiles';

// These special piles belong to expansions whose card info is not loaded by CardInfoLookup yet,
// so card info and card creation are replaced with simple stand-ins.

const randomizerTypes = new Map<string, CardType[]>([
  ['Castles', [CardType.VICTORY, CardType.CASTLE]],
  ['Encampment/Plunder', [CardType.ACTION]],
  ['Patrician/Emporium', [CardType.ACTION]],
  ['Settlers/Bustling Village', [CardType.ACTION]],
  ['Catapult/Rocks', [CardType.ACTION, CardType.ATTACK]],
  ['Gladiator/Fortune', [CardType.ACTION]],
  ['Townsfolk', [CardType.ACTION, CardType.TOWNSFOLK]],
  ['Augurs', [CardType.ACTION, CardType.AUGUR]],
  ['Odysseys', [CardType.ACTION, CardType.ODYSSEY]],
  ['Wizards', [CardType.ACTION, CardType.WIZARD]],
  ['Clashes', [CardType.ACTION, CardType.CLASH]],
  ['Forts', [CardType.ACTION, CardType.FORT]],
  ['Sauna/Avanto', [CardType.ACTION]],
  ['Knights', [CardType.ACTION, CardType.ATTACK, CardType.KNIGHT]],
]);

const lookUpCardInfo = (name: string): CardInfo => ({
  name,
  category: randomizerTypes.has(name) ? CardCategory.RANDOMIZER_ONLY : CardCategory.CARD,
  text: '',
  font_size: 'medium',
  cost: { coins: 0 },
  types: randomizerTypes.get(name) ?? [CardType.ACTION],
  expansion: Expansion.TESTING,
});

vi.mock('@dominion/card-info', () => ({
  CardInfoLookup: {
    lookUpCardInfo: (name: string) => lookUpCardInfo(name),
  },
}));

vi.mock('../../src/card/CardFactory', () => ({
  CardFactory: vi.fn(function MockCardFactory() {
    return {
      createCard: (name: string, id: string) => {
        const card = {
          id,
          getName: () => name,
          getId: () => card.id,
          setId: (value: string) => {
            card.id = value;
          },
          markAsSupplyCard: () => undefined,
          getCost: () => Cost.Simple(0),
        };
        return card;
      },
    };
  }),
}));

const createPileFactory = (numPlayers: number) =>
  new PileFactory(
    { getNumPlayers: () => numPlayers } as unknown as SharedGameState,
    { sendPileMetadata: vi.fn(), updateSharedCards: vi.fn() } as unknown as GameMessageBroadcaster,
  );

const repeat = (name: string, count: number): string[] => Array<string>(count).fill(name);

const castleNames = [
  'Humble Castle',
  'Crumbling Castle',
  'Small Castle',
  'Haunted Castle',
  'Opulent Castle',
  'Sprawling Castle',
  'Grand Castle',
  "King's Castle",
];

const lookup = new SpecialPileLookup();

describe('special pile definitions for expansions that are not loaded yet', () => {
  it.each([
    [SpecialPileType.ENCAMPMENT_PLUNDER, 'Encampment/Plunder', 'Encampment', 'Plunder'],
    [SpecialPileType.PATRICIAN_EMPORIUM, 'Patrician/Emporium', 'Patrician', 'Emporium'],
    [SpecialPileType.SETTLERS_BUSTLING_VILLAGE, 'Settlers/Bustling Village', 'Settlers', 'Bustling Village'],
    [SpecialPileType.CATAPULT_ROCKS, 'Catapult/Rocks', 'Catapult', 'Rocks'],
    [SpecialPileType.GLADIATOR_FORTUNE, 'Gladiator/Fortune', 'Gladiator', 'Fortune'],
    [SpecialPileType.SAUNA_AVANTO, 'Sauna/Avanto', 'Sauna', 'Avanto'],
  ])('defines %s as five of each half of the split pile in the Kingdom', (type, pileName, topCard, bottomCard) => {
    const specification = lookup.lookUpSpecialPile(type);

    expect(specification.pileName).toBe(pileName);
    expect(specification.randomizerCardInfo.name).toBe(pileName);
    expect(specification.cardInfos.map((cardInfo) => cardInfo.name)).toEqual([
      ...repeat(topCard, 5),
      ...repeat(bottomCard, 5),
    ]);
    expect(specification.pileCategories).toEqual(new Set([PileCategory.SUPPLY, PileCategory.KINGDOM]));
    expect(specification.isShuffled).toBe(false);
  });

  it.each([
    [SpecialPileType.TOWNSFOLK, 'Townsfolk', ['Town Crier', 'Blacksmith', 'Miller', 'Elder']],
    [SpecialPileType.AUGURS, 'Augurs', ['Herb Gatherer', 'Acolyte', 'Sorceress', 'Sibyl']],
    [SpecialPileType.ODYSSEYS, 'Odysseys', ['Old Map', 'Voyage', 'Sunken Treasure', 'Distant Shore']],
    [SpecialPileType.WIZARDS, 'Wizards', ['Student', 'Conjurer', 'Sorcerer', 'Lich']],
    [SpecialPileType.CLASHES, 'Clashes', ['Battle Plan', 'Archer', 'Warlord', 'Territory']],
    [SpecialPileType.FORTS, 'Forts', ['Tent', 'Garrison', 'Hill Fort', 'Stronghold']],
  ])('defines %s as four copies of each of its four cards in order', (type, pileName, cardNames) => {
    const specification = lookup.lookUpSpecialPile(type);

    expect(specification.pileName).toBe(pileName);
    expect(specification.randomizerCardInfo.name).toBe(pileName);
    expect(specification.cardInfos.map((cardInfo) => cardInfo.name)).toEqual(
      cardNames.flatMap((cardName) => repeat(cardName, 4)),
    );
    expect(specification.pileCategories).toEqual(new Set([PileCategory.SUPPLY, PileCategory.KINGDOM]));
    expect(specification.isShuffled).toBe(false);
  });

  it('defines the 2-player Castles pile as one of each Castle sorted by cost', () => {
    const specification = lookup.lookUpSpecialPile(SpecialPileType.CASTLES);

    expect(specification.pileName).toBe('Castles');
    expect(specification.cardInfos.map((cardInfo) => cardInfo.name)).toEqual(castleNames);
    expect(specification.pileCategories).toEqual(new Set([PileCategory.SUPPLY, PileCategory.KINGDOM]));
    expect(specification.isShuffled).toBe(false);
  });

  it('defines the multiplayer Castles pile with two each of the Humble, Small, Opulent and King’s Castles', () => {
    const specification = lookup.lookUpSpecialPile(SpecialPileType.CASTLES_MULTIPLAYER);

    expect(specification.pileName).toBe('Castles');
    expect(specification.cardInfos.map((cardInfo) => cardInfo.name)).toEqual([
      ...repeat('Humble Castle', 2),
      'Crumbling Castle',
      ...repeat('Small Castle', 2),
      'Haunted Castle',
      ...repeat('Opulent Castle', 2),
      'Sprawling Castle',
      'Grand Castle',
      ...repeat("King's Castle", 2),
    ]);
    expect(specification.pileCategories).toEqual(new Set([PileCategory.SUPPLY, PileCategory.KINGDOM]));
    expect(specification.isShuffled).toBe(false);
  });

  it.each([
    'Knights',
    'Castles',
    'Patrician/Emporium',
    'Settlers/Bustling Village',
    'Catapult/Rocks',
    'Gladiator/Fortune',
    'Townsfolk',
    'Augurs',
    'Odysseys',
    'Wizards',
    'Clashes',
    'Forts',
    'Sauna/Avanto',
  ])('looks up the %s special pile by its randomizer name', (randomizerName) => {
    expect(lookup.lookUpSpecialPile(randomizerName as SpecialPileType).pileName).toBe(randomizerName);
  });

  // BUG: SpecialPileType.ENCAMPMENT_PLUNDER is 'Encampment_plunder', not the randomizer name 'Encampment/Plunder'
  it('looks up the Encampment/Plunder special pile by its randomizer name', () => {
    expect(lookup.lookUpSpecialPile('Encampment/Plunder' as SpecialPileType).pileName).toBe('Encampment/Plunder');
  });
});

describe('creating special piles for expansions that are not loaded yet', () => {
  it('creates an 8-card Castles pile for 2 players and a 12-card one for 3 or more players', () => {
    const twoPlayerPile = createPileFactory(2).createSpecialPile(lookup.lookUpSpecialPile(SpecialPileType.CASTLES));
    const multiplayerPile = createPileFactory(3).createSpecialPile(
      lookup.lookUpSpecialPile(SpecialPileType.CASTLES_MULTIPLAYER),
    );

    expect(twoPlayerPile.size()).toBe(8);
    expect(multiplayerPile.size()).toBe(12);
  });

  it('creates ten-card split piles for any number of players', () => {
    for (const numPlayers of [2, 4]) {
      const pile = createPileFactory(numPlayers).createSpecialPile(
        lookup.lookUpSpecialPile(SpecialPileType.ENCAMPMENT_PLUNDER),
      );

      expect(pile.name).toBe('Encampment/Plunder');
      expect(pile.size()).toBe(10);
    }
  });

  // BUG: createSpecialPile puts the first-listed cards at the bottom, so e.g. Plunder ends up on top of Encampment
  it('puts the first-listed cards on top of unshuffled special piles', () => {
    const splitPile = createPileFactory(2).createSpecialPile(
      lookup.lookUpSpecialPile(SpecialPileType.ENCAMPMENT_PLUNDER),
    );
    const castlesPile = createPileFactory(2).createSpecialPile(lookup.lookUpSpecialPile(SpecialPileType.CASTLES));

    const splitPileFromTop = [...splitPile.toCardNameArray()].reverse();
    expect(splitPileFromTop).toEqual([...repeat('Encampment', 5), ...repeat('Plunder', 5)]);
    expect(splitPile.getTopCard()?.getName()).toBe('Encampment');
    expect(castlesPile.getTopCard()?.getName()).toBe(convertToClassName('Humble Castle'));
    expect(castlesPile.asCardArray()[0].getName()).toBe(convertToClassName("King's Castle"));
  });

  // BUG: the 16-card Allies split piles are trimmed to the default pile size of 10
  it('keeps all sixteen cards of an Allies split pile', () => {
    const pile = createPileFactory(2).createSpecialPile(lookup.lookUpSpecialPile(SpecialPileType.TOWNSFOLK));

    expect(pile.size()).toBe(16);
  });
});
