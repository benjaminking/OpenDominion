import { CardCategory, CardInfo, CardType, Expansion, Mechanic, PileCategory } from '@dominion/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { Cost } from '../../src/card/Cost';
import { Pile } from '../../src/piles/Pile';
import { AddedPilePostAction } from '../../src/setup/AddedPilePostAction';
import { GameInitializer } from '../../src/setup/GameInitializer';
import { PileAddingSetupRule } from '../../src/setup/PileAddingSetupRule';
import { PileSpecification } from '../../src/setup/PileSpecification';
import { GameInitializationSetupRule, SetupRuleType } from '../../src/setup/SetupRule';
import { SetupRules } from '../../src/setup/SetupRules';

const victoryCardNames = new Set(['Estate', 'Duchy', 'Province', 'Colony', 'Gardens', 'Castles']);
const treasureCardNames = new Set(['Copper', 'Silver', 'Gold', 'Platinum', 'Potion', 'Spoils']);
const randomizerOnlyCardNames = new Set(['Knights', 'Castles']);

const lookUpCardInfo = (name: string): CardInfo => {
  let types: CardType[] = [CardType.ACTION];
  if (victoryCardNames.has(name)) {
    types = [CardType.VICTORY];
  } else if (treasureCardNames.has(name)) {
    types = [CardType.TREASURE];
  } else if (name === 'Curse') {
    types = [CardType.CURSE];
  }
  return {
    name,
    category: randomizerOnlyCardNames.has(name) ? CardCategory.RANDOMIZER_ONLY : CardCategory.CARD,
    text: `${name} text`,
    font_size: 'small',
    cost: { coins: 0 },
    types,
    expansion: Expansion.TESTING,
    mechanics: [],
  };
};

vi.mock('@dominion/card-info', () => ({
  CardInfoLookup: {
    lookUpCardInfo: (name: string) => lookUpCardInfo(name),
  },
}));

const kingdomChooserState = {
  kingdomRandomizers: [] as Card[],
  extraPileRandomizers: [] as Card[],
  prosperityProportion: 0,
  darkAgesProportion: 0,
};

const hasMoreKingdomCardsMock = vi.fn(() => kingdomChooserState.kingdomRandomizers.length > 0);
const getNextKingdomRandomizerMock = vi.fn(() => kingdomChooserState.kingdomRandomizers.shift());
const selectMatchingRandomizerMock = vi.fn((_pileSpecification: PileSpecification) =>
  kingdomChooserState.extraPileRandomizers.shift(),
);
const getProportionFromExpansionMock = vi.fn((expansion: Expansion) => {
  if (expansion === Expansion.PROSPERITY) {
    return kingdomChooserState.prosperityProportion;
  }
  if (expansion === Expansion.DARK_AGES) {
    return kingdomChooserState.darkAgesProportion;
  }
  return 0;
});
const applyGameStateSetupRulesMock = vi.fn();

vi.mock('../../src/setup/KingdomChooser', () => ({
  KingdomChooser: vi.fn(function MockKingdomChooser() {
    return {
      hasMoreKingdomCards: hasMoreKingdomCardsMock,
      getNextKingdomRandomizer: getNextKingdomRandomizerMock,
      selectMatchingRandomizer: selectMatchingRandomizerMock,
      getProportionFromExpansion: getProportionFromExpansionMock,
      applyGameStateSetupRules: applyGameStateSetupRulesMock,
    };
  }),
}));

const createCardMock = vi.fn((name: string, id: string) => {
  const card = {
    id,
    getName: () => name,
    getId: () => card.id,
    setId: (value: string) => {
      card.id = value;
    },
    markAsSupplyCard: vi.fn(),
    getCost: () => Cost.Simple(0),
  };
  return card;
});

vi.mock('../../src/card/CardFactory', () => ({
  CardFactory: vi.fn(function MockCardFactory() {
    return {
      createCard: createCardMock,
    };
  }),
}));

const useSheltersMock = vi.fn();
const deckConfiguration = { id: 'deck-config' };
const buildDeckConfigMock = vi.fn(() => deckConfiguration);
vi.mock('../../src/setup/StartingDeckConfigurationBuilder', () => ({
  StartingDeckConfigurationBuilder: vi.fn(function MockBuilder() {
    return {
      useShelters: useSheltersMock,
      build: buildDeckConfigMock,
    };
  }),
}));

interface PlayerMock {
  getOwnedCards: () => {
    initialize: ReturnType<typeof vi.fn>;
  };
  calculateScore: ReturnType<typeof vi.fn>;
}

const playersState: PlayerMock[] = [];

const gameState = {
  numPlayers: 2,
  piles: {
    addBasicTreasurePile: vi.fn(),
    addBasicVictoryPile: vi.fn(),
    addKingdomPile: vi.fn(),
    addNonKingdomSupplyPile: vi.fn(),
    addNonSupplyPile: vi.fn(),
  },
  registerCardMechanics: vi.fn(),
  replaceCardsInPiles: vi.fn(),
  getNumPlayers: () => gameState.numPlayers,
};

const choosePlayerOrderMock = vi.fn();
const runGameMock = vi.fn(async () => ({ playerResults: [] }));

vi.mock('../../src/Game', () => ({
  Game: vi.fn(function MockGame(players: unknown[]) {
    gameState.numPlayers = players.length;
    return {
      choosePlayerOrder: choosePlayerOrderMock,
      runGame: runGameMock,
      getGameState: () => gameState,
      getMessageBroadcaster: () => ({ sendPileMetadata: vi.fn(), updateSharedCards: vi.fn() }),
      getPlayers: () => playersState,
    };
  }),
}));

const createRandomizer = (name: string, options: { mechanics?: Mechanic[]; setupRules?: SetupRules } = {}): Card => {
  const setupRules = options.setupRules ?? new SetupRules();
  return {
    getPileName: () => name,
    usesMechanic: (mechanic: Mechanic) => (options.mechanics ?? []).includes(mechanic),
    getSetupRules: () => setupRules,
  } as unknown as Card;
};

const addPlayers = (count: number): PlayerMock[] => {
  const players = Array.from({ length: count }, () => {
    const ownedCards = { initialize: vi.fn() };
    return { calculateScore: vi.fn(), getOwnedCards: () => ownedCards };
  });
  playersState.push(...players);
  return players;
};

const specs = (count: number) => Array.from({ length: count }, () => ({}) as never);

const createInitializer = (
  kingdomRandomizers: Card[],
  options: { numPlayers?: number; useColoniesPlatinum?: boolean; useShelters?: boolean } = {},
): GameInitializer => {
  const numPlayers = options.numPlayers ?? 2;
  addPlayers(numPlayers);
  kingdomChooserState.kingdomRandomizers = kingdomRandomizers;
  return new GameInitializer(specs(numPlayers), [], {
    useColoniesPlatinum: options.useColoniesPlatinum ?? false,
    useShelters: options.useShelters ?? false,
  });
};

const pilesPassedTo = (mock: ReturnType<typeof vi.fn>): Pile[] => mock.mock.calls.map((call) => call[0] as Pile);

const pileNamed = (mock: ReturnType<typeof vi.fn>, name: string): Pile | undefined =>
  pilesPassedTo(mock).find((pile) => pile.name === name);

describe('GameInitializer', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    kingdomChooserState.kingdomRandomizers = [];
    kingdomChooserState.extraPileRandomizers = [];
    kingdomChooserState.prosperityProportion = 0;
    kingdomChooserState.darkAgesProportion = 0;
    playersState.length = 0;
  });

  it('initializes kingdom and base piles and calculates player score', () => {
    const [playerOne, playerTwo] = addPlayers(2);
    kingdomChooserState.kingdomRandomizers = [createRandomizer('Village')];

    new GameInitializer(specs(2), ['Village']);

    expect(choosePlayerOrderMock).toHaveBeenCalledTimes(1);
    expect(pilesPassedTo(gameState.piles.addKingdomPile).map((pile) => pile.name)).toEqual(['Village']);
    expect(pilesPassedTo(gameState.piles.addBasicTreasurePile).map((pile) => pile.name)).toEqual([
      'Copper',
      'Silver',
      'Gold',
    ]);
    expect(pilesPassedTo(gameState.piles.addBasicVictoryPile).map((pile) => pile.name)).toEqual([
      'Estate',
      'Duchy',
      'Province',
      'Curse',
    ]);
    expect(playerOne.calculateScore).toHaveBeenCalledTimes(1);
    expect(playerTwo.calculateScore).toHaveBeenCalledTimes(1);
    expect(applyGameStateSetupRulesMock).toHaveBeenCalledTimes(1);
    expect(applyGameStateSetupRulesMock).toHaveBeenCalledWith(gameState);
  });

  it('keeps adding kingdom piles until the kingdom chooser has no more kingdom cards', () => {
    createInitializer([createRandomizer('Village'), createRandomizer('Smithy'), createRandomizer('Market')]);

    expect(pilesPassedTo(gameState.piles.addKingdomPile).map((pile) => pile.name)).toEqual([
      'Village',
      'Smithy',
      'Market',
    ]);
    expect(pileNamed(gameState.piles.addKingdomPile, 'Smithy')?.getCategories()).toEqual(
      new Set([PileCategory.KINGDOM, PileCategory.SUPPLY]),
    );
  });

  it.each([
    [2, 8, 10],
    [3, 12, 20],
    [4, 12, 30],
  ])(
    'uses victory pile sizes for %i players for basic and kingdom victory cards',
    (numPlayers, victoryPileSize, cursePileSize) => {
      createInitializer([createRandomizer('Gardens')], { numPlayers });

      expect(pileNamed(gameState.piles.addKingdomPile, 'Gardens')?.size()).toBe(victoryPileSize);
      expect(pileNamed(gameState.piles.addBasicVictoryPile, 'Estate')?.size()).toBe(victoryPileSize);
      expect(pileNamed(gameState.piles.addBasicVictoryPile, 'Duchy')?.size()).toBe(victoryPileSize);
      expect(pileNamed(gameState.piles.addBasicVictoryPile, 'Province')?.size()).toBe(victoryPileSize);
      expect(pileNamed(gameState.piles.addBasicVictoryPile, 'Curse')?.size()).toBe(cursePileSize);
    },
  );

  it('creates ten-card kingdom piles and standard-size Silver and Gold piles', () => {
    createInitializer([createRandomizer('Village')], { numPlayers: 3 });

    expect(pileNamed(gameState.piles.addKingdomPile, 'Village')?.size()).toBe(10);
    expect(pileNamed(gameState.piles.addBasicTreasurePile, 'Silver')?.size()).toBe(40);
    expect(pileNamed(gameState.piles.addBasicTreasurePile, 'Gold')?.size()).toBe(30);
  });

  it('delegates runGame to the underlying game instance', async () => {
    addPlayers(1);
    const initializer = new GameInitializer(specs(1), []);

    await initializer.runGame();

    expect(runGameMock).toHaveBeenCalledTimes(1);
  });

  it('creates a special pile for randomizer-only kingdom cards such as Knights', () => {
    createInitializer([createRandomizer('Knights')]);

    const knightsPile = pileNamed(gameState.piles.addKingdomPile, 'Knights');
    expect(knightsPile?.size()).toBe(10);
    expect(knightsPile?.getCategories()).toEqual(new Set([PileCategory.SUPPLY, PileCategory.KINGDOM]));
    expect(new Set(knightsPile?.toCardNameArray())).toEqual(
      new Set([
        'DameAnna',
        'DameJosephine',
        'DameMolly',
        'DameNatalie',
        'DameSylvia',
        'SirBailey',
        'SirDestry',
        'SirMartin',
        'SirMichael',
        'SirVander',
      ]),
    );
  });

  it('registers the mechanics of every kingdom randomizer with the game state', () => {
    const village = createRandomizer('Village');
    const smithy = createRandomizer('Smithy');

    createInitializer([village, smithy]);

    expect(gameState.registerCardMechanics).toHaveBeenCalledWith(village);
    expect(gameState.registerCardMechanics).toHaveBeenCalledWith(smithy);
  });

  it('adds a Potion pile to the basic treasures when a kingdom card uses Potions', () => {
    createInitializer([createRandomizer('Alchemist', { mechanics: [Mechanic.POTIONS] })]);

    const potionPile = pileNamed(gameState.piles.addBasicTreasurePile, 'Potion');
    expect(potionPile?.size()).toBe(16);
    expect(potionPile?.getCategories()).toEqual(new Set([PileCategory.BASIC_TREASURE, PileCategory.SUPPLY]));
  });

  it('does not add piles for mechanics that no kingdom card uses', () => {
    createInitializer([createRandomizer('Village')]);

    expect(pileNamed(gameState.piles.addBasicTreasurePile, 'Potion')).toBeUndefined();
    expect(gameState.piles.addNonSupplyPile).not.toHaveBeenCalled();
    expect(gameState.piles.addNonKingdomSupplyPile).not.toHaveBeenCalled();
  });

  it('adds the Rewards pile outside the Supply when a kingdom card uses Rewards', () => {
    createInitializer([createRandomizer('Joust', { mechanics: [Mechanic.REWARDS] })]);

    const rewardsPile = pileNamed(gameState.piles.addNonSupplyPile, 'Rewards');
    // One of each Reward in a 2-player game
    expect(rewardsPile?.size()).toBe(6);
    expect(rewardsPile?.getCategories()).toEqual(new Set([PileCategory.NON_SUPPLY]));
    expect(pileNamed(gameState.piles.addKingdomPile, 'Rewards')).toBeUndefined();
    expect(pileNamed(gameState.piles.addNonKingdomSupplyPile, 'Rewards')).toBeUndefined();
  });

  it('adds the Spoils and Madman piles outside the Supply when kingdom cards use them', () => {
    createInitializer([
      createRandomizer('Bandit Camp', { mechanics: [Mechanic.SPOILS] }),
      createRandomizer('Hermit', { mechanics: [Mechanic.MADMAN] }),
    ]);

    const spoilsPile = pileNamed(gameState.piles.addNonSupplyPile, 'Spoils');
    const madmanPile = pileNamed(gameState.piles.addNonSupplyPile, 'Madman');
    expect(spoilsPile?.size()).toBe(15);
    expect(spoilsPile?.getCategories()).toEqual(new Set([PileCategory.NON_SUPPLY]));
    expect(madmanPile?.size()).toBe(10);
    expect(madmanPile?.getCategories()).toEqual(new Set([PileCategory.NON_SUPPLY]));
  });

  it.each([
    [2, 10],
    [3, 20],
    [4, 30],
  ])('adds a Supply (non-Kingdom) Ruins pile for %i players when a kingdom card uses Ruins', (numPlayers, size) => {
    createInitializer([createRandomizer('Marauder', { mechanics: [Mechanic.SPOILS, Mechanic.RUINS] })], {
      numPlayers,
    });

    const ruinsPile = pileNamed(gameState.piles.addNonKingdomSupplyPile, 'Ruins');
    expect(ruinsPile?.size()).toBe(size);
    expect(ruinsPile?.getCategories()).toEqual(new Set([PileCategory.SUPPLY]));
    expect(pileNamed(gameState.piles.addKingdomPile, 'Ruins')).toBeUndefined();
  });

  it('adds the Mercenary pile outside the Supply when a kingdom card uses Mercenaries', () => {
    createInitializer([createRandomizer('Urchin', { mechanics: [Mechanic.MERCENARY] })]);

    const mercenaryPile = pileNamed(gameState.piles.addNonSupplyPile, 'Mercenary');
    expect(mercenaryPile?.size()).toBe(10);
    expect(mercenaryPile?.getCategories()).toEqual(new Set([PileCategory.NON_SUPPLY]));
  });

  describe('Platinum and Colony', () => {
    it('adds Platinum and Colony piles when requested', () => {
      createInitializer([createRandomizer('Village')], { useColoniesPlatinum: true });

      expect(pileNamed(gameState.piles.addBasicTreasurePile, 'Platinum')?.size()).toBe(12);
      expect(pileNamed(gameState.piles.addBasicVictoryPile, 'Colony')?.size()).toBe(8);
    });

    it('does not add Platinum and Colony when disabled, regardless of the kingdom', () => {
      kingdomChooserState.prosperityProportion = 1;

      createInitializer([createRandomizer('Village')], { useColoniesPlatinum: false });

      expect(pileNamed(gameState.piles.addBasicTreasurePile, 'Platinum')).toBeUndefined();
      expect(pileNamed(gameState.piles.addBasicVictoryPile, 'Colony')).toBeUndefined();
    });

    it.each([
      [0.3, true],
      [0.2, false],
    ])(
      'decides from the proportion of Prosperity kingdom cards when unspecified (proportion %f)',
      (proportion, expected) => {
        vi.spyOn(Math, 'random').mockReturnValue(0.25);
        kingdomChooserState.prosperityProportion = proportion;
        addPlayers(2);
        kingdomChooserState.kingdomRandomizers = [createRandomizer('Village')];

        new GameInitializer(specs(2), [], { useShelters: false });

        expect(getProportionFromExpansionMock).toHaveBeenCalledWith(Expansion.PROSPERITY);
        expect(pileNamed(gameState.piles.addBasicTreasurePile, 'Platinum') !== undefined).toBe(expected);
        expect(pileNamed(gameState.piles.addBasicVictoryPile, 'Colony') !== undefined).toBe(expected);
      },
    );
  });

  describe('Shelters', () => {
    it('uses Shelters in starting decks when requested', () => {
      createInitializer([createRandomizer('Village')], { useShelters: true });

      expect(useSheltersMock).toHaveBeenCalledTimes(1);
    });

    it('does not use Shelters when disabled, regardless of the kingdom', () => {
      kingdomChooserState.darkAgesProportion = 1;

      createInitializer([createRandomizer('Village')], { useShelters: false });

      expect(useSheltersMock).not.toHaveBeenCalled();
    });

    it.each([
      [0.6, true],
      [0.4, false],
    ])(
      'decides from the proportion of Dark Ages kingdom cards when unspecified (proportion %f)',
      (proportion, used) => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        kingdomChooserState.darkAgesProportion = proportion;
        addPlayers(2);
        kingdomChooserState.kingdomRandomizers = [createRandomizer('Village')];

        new GameInitializer(specs(2), [], { useColoniesPlatinum: false });

        expect(getProportionFromExpansionMock).toHaveBeenCalledWith(Expansion.DARK_AGES);
        expect(useSheltersMock.mock.calls.length > 0).toBe(used);
      },
    );
  });

  it("initializes every player's cards from the built starting deck configuration", () => {
    const players = addPlayers(3);
    kingdomChooserState.kingdomRandomizers = [createRandomizer('Village')];

    new GameInitializer(specs(3), [], { useColoniesPlatinum: false, useShelters: true });

    for (const player of players) {
      expect(player.getOwnedCards().initialize).toHaveBeenCalledWith(deckConfiguration);
    }
    expect(useSheltersMock.mock.invocationCallOrder[0]).toBeLessThan(buildDeckConfigMock.mock.invocationCallOrder[0]);
  });

  it("applies each kingdom card's initialization setup rules to the initializer", () => {
    const setupRules = new SetupRules();
    const firstRule: GameInitializationSetupRule = {
      setupRuleType: SetupRuleType.GAME_INITIALIZATION,
      applySetupRule: vi.fn(),
    };
    const secondRule: GameInitializationSetupRule = {
      setupRuleType: SetupRuleType.GAME_INITIALIZATION,
      applySetupRule: vi.fn(),
    };
    setupRules.add(firstRule);
    setupRules.add(secondRule);

    const initializer = createInitializer([createRandomizer('Charlatan', { setupRules })]);

    expect(firstRule.applySetupRule).toHaveBeenCalledWith(initializer);
    expect(secondRule.applySetupRule).toHaveBeenCalledWith(initializer);
    expect(setupRules.hasAnyGameInitializationSetupRules()).toBe(false);
  });

  it('replaces cards in piles through the game state', () => {
    const initializer = createInitializer([createRandomizer('Charlatan')]);

    initializer.replaceCardsInPiles('Curse', 'CharlatanCurse');

    expect(gameState.replaceCardsInPiles).toHaveBeenCalledWith('Curse', 'CharlatanCurse');
  });

  describe('addRandomPile', () => {
    it('passes the pile specification to the kingdom chooser', () => {
      const initializer = createInitializer([]);
      const pileSpecification = new PileSpecification({ requiredCoinCosts: [2, 3] }, true, true);

      initializer.addRandomPile(pileSpecification);

      expect(selectMatchingRandomizerMock).toHaveBeenCalledWith(pileSpecification);
    });

    it('returns undefined and adds no pile when no randomizer matches', () => {
      const initializer = createInitializer([]);

      const pile = initializer.addRandomPile(new PileSpecification({ requiredCoinCosts: [2, 3] }, true, true));

      expect(pile).toBeUndefined();
      expect(gameState.piles.addKingdomPile).not.toHaveBeenCalled();
      expect(gameState.piles.addNonSupplyPile).not.toHaveBeenCalled();
    });

    it('adds the matching pile to the Kingdom for a kingdom pile specification', () => {
      const initializer = createInitializer([]);
      kingdomChooserState.extraPileRandomizers = [createRandomizer('Moat')];

      initializer.addRandomPile(new PileSpecification({ requiredCoinCosts: [2, 3] }, true, true));

      expect(pilesPassedTo(gameState.piles.addKingdomPile).map((pile) => pile.name)).toEqual(['Moat']);
      expect(pileNamed(gameState.piles.addKingdomPile, 'Moat')?.size()).toBe(10);
    });

    it('returns the pile it adds', () => {
      const initializer = createInitializer([]);
      kingdomChooserState.extraPileRandomizers = [createRandomizer('Moat')];

      const pile = initializer.addRandomPile(new PileSpecification({ requiredCoinCosts: [2, 3] }, true, true));

      expect(pile).toBeDefined();
      expect(pile).toBe(pileNamed(gameState.piles.addKingdomPile, 'Moat'));
    });

    it("runs a kingdom card's pile-adding post action on the pile added during setup", () => {
      const postAction = vi.fn();
      const setupRules = new SetupRules();
      setupRules.add(
        new PileAddingSetupRule(
          new PileSpecification({ requiredCoinCosts: [2, 3] }, true, true),
          new AddedPilePostAction(postAction),
        ),
      );
      kingdomChooserState.extraPileRandomizers = [createRandomizer('Moat')];

      createInitializer([createRandomizer('Young Witch', { setupRules })]);

      expect(postAction).toHaveBeenCalledTimes(1);
      expect(postAction).toHaveBeenCalledWith(pileNamed(gameState.piles.addKingdomPile, 'Moat'));
    });

    it('adds the matching pile outside the Supply for a non-supply pile specification', () => {
      const initializer = createInitializer([]);
      kingdomChooserState.extraPileRandomizers = [createRandomizer('Moat')];

      initializer.addRandomPile(new PileSpecification({ requiredCoinCosts: [3, 4] }));

      expect(pileNamed(gameState.piles.addNonSupplyPile, 'Moat')).toBeDefined();
      expect(gameState.piles.addKingdomPile).not.toHaveBeenCalled();
      expect(gameState.piles.addNonKingdomSupplyPile).not.toHaveBeenCalled();
    });
  });

  it('uses the 12-card Castles pile in games with 3 or more players', () => {
    createInitializer([createRandomizer('Castles')], { numPlayers: 3 });

    expect(pileNamed(gameState.piles.addKingdomPile, 'Castles')?.size()).toBe(12);
  });
});
