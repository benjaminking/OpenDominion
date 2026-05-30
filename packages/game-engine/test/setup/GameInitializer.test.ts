import { afterEach, describe, expect, it, vi } from 'vitest';

const cardInfoState = vi.hoisted(() => {
  const lookedUpCards: string[] = [];
  const lookUpCardInfoMock = vi.fn((name: string) => {
    lookedUpCards.push(name);
    return {
      name,
      text: `${name} text`,
      font_size: 'small',
      cost: { coins: 0 },
      types: name === 'Duchy' ? ['victory'] : ['action'],
      expansion: 'testing',
      mechanics: [],
    };
  });

  return {
    lookedUpCards,
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

const selectRandomizersMock = vi.fn(() => ({
  getCards: () => randomizersState.cards,
  getProportionFromExpansion: (expansion: unknown) => {
    const expansionText = String(expansion).toLowerCase();
    if (expansionText.includes('prosperity')) {
      return randomizersState.prosperityProportion;
    }
    if (expansionText.includes('dark')) {
      return randomizersState.darkAgesProportion;
    }
    return randomizersState.prosperityProportion;
  },
}));

vi.mock('../../src/setup/KingdomChooser', () => ({
  KingdomChooser: vi.fn(function MockKingdomChooser() {
    return {
      selectRandomizers: selectRandomizersMock,
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
    calculatePoints: ReturnType<typeof vi.fn>;
    initialize: ReturnType<typeof vi.fn>;
  };
}[] = [];

const addBasicTreasurePileMock = vi.fn();
const addBasicVictoryPileMock = vi.fn();
const addKingdomPileMock = vi.fn();

const choosePlayerOrderMock = vi.fn();
const startGameMock = vi.fn(async () => undefined);
const runGameMock = vi.fn(async () => ({ playerResults: [] }));

vi.mock('../../src/Game', () => ({
  Game: vi.fn(function MockGame() {
    return {
      choosePlayerOrder: choosePlayerOrderMock,
      startGame: startGameMock,
      runGame: runGameMock,
      getGameState: () => ({
        piles: {
          addBasicTreasurePile: addBasicTreasurePileMock,
          addBasicVictoryPile: addBasicVictoryPileMock,
          addKingdomPile: addKingdomPileMock,
        },
      }),
      getMessageBroadcaster: () => ({ id: 'broadcaster' }),
      getPlayers: () => playersState,
    };
  }),
}));

import { GameInitializer } from '../../src/setup/GameInitializer';

const createRandomizer = (name: string, isVictory = false, usesPotion = false) => ({
  getPileName: () => name,
  hasType: (_type: unknown) => isVictory,
  usesMechanic: (_mechanic: unknown) => usesPotion,
});

describe('GameInitializer', () => {
  const specs = (count: number) => Array.from({ length: count }, () => ({}) as never);

  afterEach(() => {
    vi.restoreAllMocks();
    cardInfoState.lookedUpCards.length = 0;
    createdPiles.length = 0;
    randomizersState.cards = [];
    randomizersState.prosperityProportion = 0;
    randomizersState.darkAgesProportion = 0;
    playersState.length = 0;
    addBasicTreasurePileMock.mockClear();
    addBasicVictoryPileMock.mockClear();
    addKingdomPileMock.mockClear();
    choosePlayerOrderMock.mockClear();
    startGameMock.mockClear();
    runGameMock.mockClear();
    createPileMock.mockClear();
    useSheltersMock.mockClear();
    buildDeckConfigMock.mockClear();
    selectRandomizersMock.mockClear();
    cardInfoState.lookUpCardInfoMock.mockClear();
  });

  it('initializes kingdom, base supply piles, points, and starting decks', () => {
    const playerOneOwned = {
      calculatePoints: vi.fn(),
      initialize: vi.fn(),
    };
    const playerTwoOwned = {
      calculatePoints: vi.fn(),
      initialize: vi.fn(),
    };
    const playerOneMock = { calculateScore: vi.fn(), getOwnedCards: () => playerOneOwned };
    const playerTwoMock = { calculateScore: vi.fn(), getOwnedCards: () => playerTwoOwned };
    playersState.push(playerOneMock, playerTwoMock);

    randomizersState.cards = [createRandomizer('Village')];

    new GameInitializer(specs(2), ['Village']);

    expect(choosePlayerOrderMock).toHaveBeenCalledTimes(1);
    expect(selectRandomizersMock).toHaveBeenCalledWith(['Village']);
    expect(addKingdomPileMock).toHaveBeenCalledTimes(1);
    expect(addBasicTreasurePileMock).toHaveBeenCalledTimes(3);
    expect(addBasicVictoryPileMock).toHaveBeenCalledTimes(4);
    expect(playerOneMock.calculateScore).toHaveBeenCalledTimes(1);
    expect(playerTwoMock.calculateScore).toHaveBeenCalledTimes(1);
    expect(playerOneOwned.initialize).toHaveBeenCalledWith({ id: 'deck-config' });
    expect(playerTwoOwned.initialize).toHaveBeenCalledWith({ id: 'deck-config' });
  });

  it('uses victory pile size rules for kingdom victory cards and 3+ player games', () => {
    const owned = {
      calculatePoints: vi.fn(),
      initialize: vi.fn(),
    };
    playersState.push({ calculateScore: vi.fn(), getOwnedCards: () => owned }, { calculateScore: vi.fn(), getOwnedCards: () => owned }, { calculateScore: vi.fn(), getOwnedCards: () => owned });
    randomizersState.cards = [createRandomizer('Duchy', true)];

    new GameInitializer(specs(3), []);

    const duchyPile = createdPiles.find((pile) => pile.name === 'Duchy');
    expect(duchyPile?.size).toBe(12);

    const estatePile = createdPiles.find((pile) => pile.name === 'Estate');
    const cursePile = createdPiles.find((pile) => pile.name === 'Curse');
    expect(estatePile?.size).toBe(12);
    expect(cursePile?.size).toBe(20);
  });

  it('adds prosperity and dark-ages setup when randomizer proportions trigger them', () => {
    const owned = {
      calculatePoints: vi.fn(),
      initialize: vi.fn(),
    };
    playersState.push({ calculateScore: vi.fn(), getOwnedCards: () => owned }, { calculateScore: vi.fn(), getOwnedCards: () => owned });
    randomizersState.cards = [createRandomizer('Market')];
    randomizersState.prosperityProportion = 1;
    randomizersState.darkAgesProportion = 1;
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    new GameInitializer(specs(2), []);

    const colonyPile = createdPiles.find((pile) => pile.name === 'Colony');
    const platinumPile = createdPiles.find((pile) => pile.name === 'Platinum');
    expect(colonyPile?.size).toBe(8);
    expect(platinumPile?.size).toBe(12);
    expect(useSheltersMock).toHaveBeenCalledTimes(1);
    randomSpy.mockRestore();
  });

  it('delegates runGame to the underlying game instance', async () => {
    playersState.push({
      calculateScore: vi.fn(),
      getOwnedCards: () => ({
        calculatePoints: vi.fn(),
        initialize: vi.fn(),
      }),
    });
    randomizersState.cards = [];
    const initializer = new GameInitializer(specs(1), []);

    await initializer.runGame();

    expect(runGameMock).toHaveBeenCalledTimes(1);
  });
});
