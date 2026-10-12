import { CardInfoLookup } from '@dominion/card-info';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

// Makes Ferryman's setup choose the given card for its pile (other random choices are unchanged).
const forceFerrymanPile = (pileName: string): void => {
  const findMatchingRandomizerName = CardInfoLookup.findMatchingRandomizerName.bind(CardInfoLookup);
  vi.spyOn(CardInfoLookup, 'findMatchingRandomizerName').mockImplementation((requirements, usedCardNames) =>
    requirements?.requiredCoinCosts?.join() === '3,4'
      ? pileName
      : findMatchingRandomizerName(requirements, usedCardNames),
  );
};

// Alice plays Market and her Treasures ($12 and 2 Buys).
const startBuying = async (game: GameHarness): Promise<void> => {
  game.alice.setHand(['Market', 'Gold', 'Gold', 'Gold', 'Copper']);
  game.alice.setDeck(coppers(20));
  await game.start();
  await game.playAction('Market');
  await game.playAllTreasures();
};

describe('Ferryman', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets up a non-Supply pile costing $3 or $4 that cannot be bought or gained other ways', async () => {
    // Real setup, made deterministic
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const randomizerSpy = vi.spyOn(CardInfoLookup, 'findMatchingRandomizerName');
    const game = createGame({ kingdom: ['Ferryman', 'Workshop'] });
    const ferrymanCall = randomizerSpy.mock.calls.findIndex(([requirements]) =>
      (requirements?.requiredCoinCosts ?? []).includes(4),
    );
    const pileName = randomizerSpy.mock.results[ferrymanCall].value as string;
    vi.restoreAllMocks();

    expect(game.state.piles.nonSupplyPiles.pileNames).toContain(pileName);
    expect(game.state.piles.supplyPiles.pileNames).not.toContain(pileName);
    expect([3, 4]).toContain(CardInfoLookup.lookUpCardInfo(pileName).cost.coins);

    game.alice.setHand(['Workshop', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    await game.start();
    await game.playAction('Workshop');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).not.toContain(pileName);
    await game.chooseCard('Silver');
    await game.playAllTreasures();
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).not.toContain(pileName);
  });

  it('gains a card from its pile each time a Ferryman is gained', async () => {
    forceFerrymanPile('Shop');
    const game = createGame({ kingdom: ['Ferryman'] });

    await startBuying(game);
    await game.buy('Ferryman');
    expect(game.alice.discard).toEqual(['Ferryman', 'Shop']);
    await game.buy('Ferryman');

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Ferryman', 'Shop', 'Ferryman', 'Shop']));
    expect(game.pileSize('Shop')).toBe(8);
  });

  it('also gains from its pile when a Ferryman is gained without buying it', async () => {
    forceFerrymanPile('Shop');
    const game = createGame({ kingdom: ['Ferryman', 'Remake'] });
    game.alice.setHand(['Remake', 'Smithy']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Remake');
    await game.chooseCard('Smithy');
    await game.chooseCard('Ferryman');

    expect(game.alice.discard).toEqual(['Ferryman', 'Shop']);
  });

  it('gains only the Ferryman once its pile is empty', async () => {
    forceFerrymanPile('Shop');
    const game = createGame({ kingdom: ['Ferryman'] });
    game.setPileSize('Shop', 0);

    await startBuying(game);
    await game.buy('Ferryman');

    expect(game.alice.discard).toEqual(['Ferryman']);
    game.expectDecision('buyPhase', 'Alice');
  });

  it('draws 2 cards, then must discard a card even if it is the only one in hand', async () => {
    forceFerrymanPile('Shop');
    const game = createGame({ kingdom: ['Ferryman'] });
    game.alice.setHand(['Ferryman']);
    game.alice.setDeck(['Estate']);

    await game.start();
    await game.playAction('Ferryman');
    if (game.pending.kind === 'chooseCard' && game.pending.playerName === 'Alice') {
      expect(game.pending.noneAllowed).toBe(false);
      await game.chooseCard('Estate');
    }

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.actions).toBe(1);
  });

  it("its empty pile is not in the Supply, so it doesn't count towards three empty Supply piles", async () => {
    forceFerrymanPile('Shop');
    const game = createGame({ kingdom: ['Ferryman'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(10));
    game.setPileSize('Shop', 0);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.endTurn();

    expect(game.isFinished).toBe(false);
    expect(game.currentPlayerName).toBe('Bob');
  });

  it("Band of Misfits can't play a card from its pile, since that pile isn't in the Supply", async () => {
    forceFerrymanPile('Shop');
    const game = createGame({ kingdom: ['Ferryman', 'Band Of Misfits'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Band Of Misfits');

    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).toContain('Village');
    expect(offered).not.toContain('Shop');
  });

  it("when its pile is Young Witch, Young Witch's setup still adds a Bane pile to the Supply", async () => {
    const findMatchingRandomizerName = CardInfoLookup.findMatchingRandomizerName.bind(CardInfoLookup);
    vi.spyOn(CardInfoLookup, 'findMatchingRandomizerName').mockImplementation((requirements, usedCardNames) => {
      const costs = requirements?.requiredCoinCosts?.join();
      if (costs === '3,4') return 'Young Witch';
      if (costs === '2,3') return 'Hamlet';
      return findMatchingRandomizerName(requirements, usedCardNames);
    });
    const game = createGame({ kingdom: ['Ferryman', 'Remake'] });
    vi.restoreAllMocks();

    expect(game.state.piles.nonSupplyPiles.pileNames).toContain('Young Witch');
    expect(game.state.piles.supplyPiles.pileNames).toContain('Hamlet');

    game.alice.setHand(['Village', 'Remake', 'Smithy', 'Estate', 'Young Witch']);
    game.alice.setDeck(['Copper', 'Estate', 'Estate', ...coppers(10)]);
    game.bob.setHand(['Hamlet', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Remake');
    await game.chooseCard('Smithy');
    await game.chooseCard('Ferryman');
    await game.chooseCard('Estate');
    await game.chooseCard('Silver');
    expect(game.alice.discard).toEqual(['Ferryman', 'Young Witch', 'Silver']);
    expect(game.pileSize('Young Witch')).toBe(9);

    // Bob can reveal the Bane against Young Witch
    await game.playAction('Young Witch');
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.declineEffects();
    }
    await game.chooseCards(['Estate', 'Estate']);
    game.expectDecision('chooseOneOption', 'Bob');
    await game.chooseOption('Yes');

    expect(game.bob.discard).toEqual([]);
  });

  it("a player who gains a Ferryman on another player's turn (from Jester) also gains a card from its pile", async () => {
    forceFerrymanPile('Shop');
    const game = createGame({ kingdom: ['Ferryman', 'Jester'] });
    game.alice.setHand(['Jester', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Ferryman', ...coppers(5)]);

    await game.start();
    await game.playAction('Jester');
    await game.chooseOption('Bob gains a copy');

    expect(game.bob.discard).toEqual(['Ferryman', 'Ferryman', 'Shop']);
    expect(game.alice.discard).toEqual([]);
    expect(game.pileSize('Shop')).toBe(9);
  });

  it('with nothing to draw and nothing else in hand, only gives +1 Action', async () => {
    forceFerrymanPile('Shop');
    const game = createGame({ kingdom: ['Ferryman'] });
    game.alice.setHand(['Ferryman']);

    await game.start();
    await game.playAction('Ferryman');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.actions).toBe(1);
    expect(game.alice.discard).toEqual([]);
  });
});
