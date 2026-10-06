import { afterEach, describe, expect, it, vi } from 'vitest';

const cardInfoState = vi.hoisted(() => {
  const lookUpCardInfoMock = vi.fn((name: string) => ({
    name,
    text: `${name} text`,
    font_size: 'small',
    cost: { coins: 0 },
    types: name === 'Duchy' ? ['victory'] : ['action'],
    expansion: 'testing',
    mechanics: [],
  }));

  return {
    lookUpCardInfoMock,
  };
});

vi.mock('@dominion/card-info', () => ({
  CardInfoLookup: {
    lookUpCardInfo: cardInfoState.lookUpCardInfoMock,
  },
}));

const randomizersState = {
  cards: [] as {
    getPileName: () => string;
    hasType: (type: string) => boolean;
    usesMechanic: (m: string) => boolean;
  }[],
  prosperityProportion: 0,
  darkAgesProportion: 0,
};

const hasMoreKingdomCardsMock = vi.fn(() => randomizersState.cards.length > 0);
const selectMatchingRandomizerMock = vi.fn(() => randomizersState.cards.shift());
const getProportionFromExpansionMock = vi.fn((expansion: unknown) => {
  const expansionText = String(expansion).toLowerCase();
  if (expansionText.includes('prosperity')) {
    return randomizersState.prosperityProportion;
  }
  if (expansionText.includes('dark')) {
    return randomizersState.darkAgesProportion;
  }
  return 0;
});
const applyGameStateSetupRulesMock = vi.fn();

vi.mock('../../src/setup/KingdomChooser', () => ({
  KingdomChooser: vi.fn(function MockKingdomChooser() {
    return {
      hasMoreKingdomCards: hasMoreKingdomCardsMock,
      selectMatchingRandomizer: selectMatchingRandomizerMock,
      getProportionFromExpansion: getProportionFromExpansionMock,
      applyGameStateSetupRules: applyGameStateSetupRulesMock,
    };
  }),
}));

const createdPiles: { name: string; size: number }[] = [];
const createPileMock = vi.fn((cardInfo: { name: string }, size: number) => {
  createdPiles.push({ name: cardInfo.name, size });
  return { name: cardInfo.name, size };
});

vi.mock('../../src/piles/PileFactory', () => ({
  PileFactory: vi.fn(function MockPileFactory() {
    return {
      createPile: createPileMock,
      createSpecialPile: vi.fn(),
    };
  }),
}));

const useSheltersMock = vi.fn();
const buildDeckConfigMock = vi.fn(() => ({ id: 'deck-config' }));
vi.mock('../../src/setup/StartingDeckConfigurationBuilder', () => ({
  StartingDeckConfigurationBuilder: vi.fn(function MockBuilder() {
    return {
      useShelters: useSheltersMock,
      build: buildDeckConfigMock,
    };
  }),
}));

const playersState: {
  getOwnedCards: () => {
    initialize: ReturnType<typeof vi.fn>;
  };
  calculateScore: ReturnType<typeof vi.fn>;
}[] = [];

const addBasicTreasurePileMock = vi.fn();
const addBasicVictoryPileMock = vi.fn();
const addKingdomPileMock = vi.fn();

const choosePlayerOrderMock = vi.fn();
const runGameMock = vi.fn(async () => ({ playerResults: [] }));

vi.mock('../../src/Game', () => ({
  Game: vi.fn(function MockGame() {
    return {
      choosePlayerOrder: choosePlayerOrderMock,
      runGame: runGameMock,
      getGameState: () => ({
        piles: {
          addBasicTreasurePile: addBasicTreasurePileMock,
          addBasicVictoryPile: addBasicVictoryPileMock,
          addKingdomPile: addKingdomPileMock,
          addNonKingdomSupplyPile: vi.fn(),
          addNonSupplyPile: vi.fn(),
          addStartingDeckConfiguration: vi.fn(),
        },
        registerCardMechanics: vi.fn(),
      }),
      getMessageBroadcaster: () => ({ id: 'broadcaster' }),
      getPlayers: () => playersState,
    };
  }),
}));

import { GameInitializer } from '../../src/setup/GameInitializer';

const createRandomizer = (name: string, isVictory = false) => ({
  getPileName: () => name,
  hasType: (_type: unknown) => isVictory,
  usesMechanic: (_mechanic: unknown) => false,
  getSetupRules: () => ({
    hasAnyGameInitializationSetupRules: () => false,
  }),
});

describe('GameInitializer', () => {
  const specs = (count: number) => Array.from({ length: count }, () => ({}) as never);

  afterEach(() => {
    vi.restoreAllMocks();
    createdPiles.length = 0;
    randomizersState.cards = [];
    randomizersState.prosperityProportion = 0;
    randomizersState.darkAgesProportion = 0;
    playersState.length = 0;
    addBasicTreasurePileMock.mockClear();
    addBasicVictoryPileMock.mockClear();
    addKingdomPileMock.mockClear();
    choosePlayerOrderMock.mockClear();
    runGameMock.mockClear();
    createPileMock.mockClear();
    useSheltersMock.mockClear();
    buildDeckConfigMock.mockClear();
    hasMoreKingdomCardsMock.mockClear();
    selectMatchingRandomizerMock.mockClear();
    getProportionFromExpansionMock.mockClear();
    applyGameStateSetupRulesMock.mockClear();
    cardInfoState.lookUpCardInfoMock.mockClear();
  });

  it('initializes kingdom and base piles and calculates player score', () => {
    const playerOneOwned = { initialize: vi.fn() };
    const playerTwoOwned = { initialize: vi.fn() };
    const playerOneMock = { calculateScore: vi.fn(), getOwnedCards: () => playerOneOwned };
    const playerTwoMock = { calculateScore: vi.fn(), getOwnedCards: () => playerTwoOwned };
    playersState.push(playerOneMock, playerTwoMock);

    randomizersState.cards = [createRandomizer('Village')];

    new GameInitializer(specs(2), ['Village']);

    expect(choosePlayerOrderMock).toHaveBeenCalledTimes(1);
    expect(addKingdomPileMock).toHaveBeenCalledTimes(1);
    expect(addBasicTreasurePileMock).toHaveBeenCalledTimes(3);
    expect(addBasicVictoryPileMock).toHaveBeenCalledTimes(4);
    expect(playerOneMock.calculateScore).toHaveBeenCalledTimes(1);
    expect(playerTwoMock.calculateScore).toHaveBeenCalledTimes(1);
    expect(applyGameStateSetupRulesMock).toHaveBeenCalledTimes(1);
  });

  it('uses larger victory pile sizes for 3+ players and victory kingdom cards', () => {
    const owned = { initialize: vi.fn() };
    playersState.push(
      { calculateScore: vi.fn(), getOwnedCards: () => owned },
      { calculateScore: vi.fn(), getOwnedCards: () => owned },
      { calculateScore: vi.fn(), getOwnedCards: () => owned },
    );
    randomizersState.cards = [createRandomizer('Duchy', true)];

    new GameInitializer(specs(3), []);

    const duchyPile = createdPiles.find((pile) => pile.name === 'Duchy');
    expect(duchyPile?.size).toBe(12);

    const estatePile = createdPiles.find((pile) => pile.name === 'Estate');
    const cursePile = createdPiles.find((pile) => pile.name === 'Curse');
    expect(estatePile?.size).toBe(12);
    expect(cursePile?.size).toBe(20);
  });

  it('delegates runGame to the underlying game instance', async () => {
    playersState.push({
      calculateScore: vi.fn(),
      getOwnedCards: () => ({ initialize: vi.fn() }),
    });
    randomizersState.cards = [];
    const initializer = new GameInitializer(specs(1), []);

    await initializer.runGame();

    expect(runGameMock).toHaveBeenCalledTimes(1);
  });
});
