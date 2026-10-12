import { CardInfoLookup } from '@dominion/card-info';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

// Makes Young Witch's setup choose the given card as the Bane (other random choices are unchanged).
const forceBane = (baneName: string): void => {
  const findMatchingRandomizerName = CardInfoLookup.findMatchingRandomizerName.bind(CardInfoLookup);
  vi.spyOn(CardInfoLookup, 'findMatchingRandomizerName').mockImplementation((requirements, usedCardNames) =>
    requirements?.requiredCoinCosts?.join() === '2,3'
      ? baneName
      : findMatchingRandomizerName(requirements, usedCardNames),
  );
};

// Alice holds Young Witch and has two Estates on top of her deck to draw and discard.
const setUpAlice = (game: GameHarness): void => {
  game.alice.setHand(['Young Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
  game.alice.setDeck(['Estate', 'Estate', ...coppers(10)]);
};

// Declines any Reaction offered to the player who is deciding.
const declineReactions = async (game: GameHarness): Promise<void> => {
  while (game.pending.kind === 'chooseFromMultipleEvents') {
    await game.declineEffects();
  }
};

// Other players may react (e.g. with Moat) when the Attack is played, before Alice draws and discards.
const playYoungWitch = async (game: GameHarness): Promise<void> => {
  await game.playAction('Young Witch');
  await declineReactions(game);
  await game.chooseCards(['Estate', 'Estate']);
};

describe('Young Witch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets up a $2 or $3 Bane pile in the Supply, and revealing a Bane from hand avoids the Curse', async () => {
    // Real setup, made deterministic
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const randomizerSpy = vi.spyOn(CardInfoLookup, 'findMatchingRandomizerName');
    const game = createGame({ kingdom: ['Young Witch'] });
    const baneCall = randomizerSpy.mock.calls.findIndex(([requirements]) =>
      (requirements?.requiredCoinCosts ?? []).includes(2),
    );
    const baneName = randomizerSpy.mock.results[baneCall].value as string;
    vi.restoreAllMocks();

    expect(game.state.piles.kingdomPiles.pileNames).toContain(baneName);
    expect(game.state.piles.kingdomPiles.pileNames).toHaveLength(11);
    expect([2, 3]).toContain(CardInfoLookup.lookUpCardInfo(baneName).cost.coins);

    setUpAlice(game);
    game.bob.setHand([baneName, 'Copper', 'Copper', 'Copper', 'Copper']);
    await game.start();
    await playYoungWitch(game);
    await declineReactions(game);
    game.expectDecision('chooseOneOption', 'Bob');
    await game.chooseOption('Yes');

    expect(game.bob.discard).not.toContain('Curse');
    expect(game.bob.hand).toContain(baneName);
    expect(game.pileSize('Curse')).toBe(10);

    // The Bane pile is in the Supply, so it can be bought
    await game.playAllTreasures();
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toContain(baneName);
  });

  it('with 3 players, only the player who reveals a Bane avoids the Curse', async () => {
    forceBane('Hamlet');
    const game = createGame({ kingdom: ['Young Witch'], players: ['Alice', 'Bob', 'Cara'] });
    setUpAlice(game);
    game.bob.setHand(['Hamlet', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.player('Cara').setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await playYoungWitch(game);
    game.expectDecision('chooseOneOption', 'Bob');
    await game.chooseOption('Yes');

    expect(game.bob.discard).toEqual([]);
    expect(game.bob.hand).toContain('Hamlet');
    expect(game.player('Cara').discard).toEqual(['Curse']);
    expect(game.pileSize('Curse')).toBe(19);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('with 3 players, hands out the last Curse in turn order', async () => {
    forceBane('Hamlet');
    const game = createGame({ kingdom: ['Young Witch'], players: ['Alice', 'Bob', 'Cara'] });
    setUpAlice(game);
    game.bob.setHand(coppers(5));
    game.player('Cara').setHand(coppers(5));
    game.setPileSize('Curse', 1);

    await game.start();
    await playYoungWitch(game);

    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.player('Cara').discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(0);
  });

  it('lets a player reveal Moat as a Bane after declining to react with it', async () => {
    forceBane('Moat');
    const game = createGame({ kingdom: ['Young Witch'] });
    setUpAlice(game);
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await playYoungWitch(game);
    await declineReactions(game);
    game.expectDecision('chooseOneOption', 'Bob');
    await game.chooseOption('Yes');

    expect(game.bob.discard).toEqual([]);
    expect(game.bob.hand).toContain('Moat');
  });

  it('lets a player block it with a Moat Bane, so there is nothing left to reveal the Bane for', async () => {
    forceBane('Moat');
    const game = createGame({ kingdom: ['Young Witch'] });
    setUpAlice(game);
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Young Witch');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Moat');
    await declineReactions(game);
    await game.chooseCards(['Estate', 'Estate']);

    // Reactions happen before Banes are revealed; the blocked attack doesn't ask about the Bane
    expect(game.pending.playerName).toBe('Alice');
    expect(game.bob.discard).toEqual([]);
  });

  it('discards the only card in hand when there are fewer than 2 to discard', async () => {
    forceBane('Hamlet');
    const game = createGame({ kingdom: ['Young Witch'] });
    game.alice.setHand(['Young Witch']);
    game.alice.setDeck(['Copper']);
    game.bob.setHand(coppers(5));

    await game.start();
    await game.playAction('Young Witch');
    if (game.pending.kind === 'chooseCards' && game.pending.playerName === 'Alice') {
      await game.chooseCards(['Copper']);
    }

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.discard).toEqual(['Copper']);
    expect(game.bob.discard).toEqual(['Curse']);
  });

  it('counts the Bane pile towards the three empty Supply piles that end the game', async () => {
    forceBane('Hamlet');
    const game = createGame({ kingdom: ['Young Witch'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(10));
    game.setPileSize('Hamlet', 0);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.endTurn();

    expect(game.isFinished).toBe(true);
  });

  it('a Beggar Bane discarded to react to it is no longer in hand, so its owner gains a Curse', async () => {
    forceBane('Beggar');
    const game = createGame({ kingdom: ['Young Witch'] });
    setUpAlice(game);
    game.bob.setHand(['Beggar', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(5));

    await game.start();
    await game.playAction('Young Witch');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Beggar');
    await declineReactions(game);
    await game.chooseCards(['Estate', 'Estate']);

    // No Bane left in hand to reveal, so no question is asked
    expect(game.pending.playerName).toBe('Alice');
    expect(game.bob.discard).toEqual(['Beggar', 'Silver', 'Curse']);
    expect(game.bob.deck[0]).toBe('Silver');
  });

  it('with two Beggar Banes, one can be discarded to react and the other revealed to avoid the Curse', async () => {
    forceBane('Beggar');
    const game = createGame({ kingdom: ['Young Witch'] });
    setUpAlice(game);
    game.bob.setHand(['Beggar', 'Beggar', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(5));

    await game.start();
    await game.playAction('Young Witch');
    await game.chooseEffect('Beggar');
    await declineReactions(game);
    await game.chooseCards(['Estate', 'Estate']);
    game.expectDecision('chooseOneOption', 'Bob');
    await game.chooseOption('Yes');

    expect(game.bob.discard).toEqual(['Beggar', 'Silver']);
    expect(game.bob.hand).toContain('Beggar');
    expect(game.pileSize('Curse')).toBe(10);
  });

  it("a Treasure Bane such as Fool's Gold can be revealed", async () => {
    forceBane("Fool's Gold");
    const game = createGame({ kingdom: ['Young Witch'] });
    setUpAlice(game);
    game.bob.setHand(["Fool's Gold", 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await playYoungWitch(game);
    game.expectDecision('chooseOneOption', 'Bob');
    await game.chooseOption('Yes');

    expect(game.bob.discard).toEqual([]);
    expect(game.bob.hand).toContain("Fool's Gold");
  });

  it('played twice by Throne Room, asks about the Bane each time, so a player can avoid only one Curse', async () => {
    forceBane('Hamlet');
    const game = createGame({ kingdom: ['Young Witch', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Young Witch', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Estate', 'Estate', 'Estate', ...coppers(10)]);
    game.bob.setHand(['Hamlet', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Young Witch');
    await declineReactions(game);
    await game.chooseCards(['Estate', 'Estate']);
    await game.chooseOption('Yes');
    await declineReactions(game);
    await game.chooseCards(['Estate', 'Estate']);
    game.expectDecision('chooseOneOption', 'Bob');
    await game.chooseOption('No');

    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.alice.discard).toEqual(['Estate', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.hand).toEqual(coppers(3));
  });

  it('a Bane can still be revealed after the Bane pile has run out', async () => {
    forceBane('Hamlet');
    const game = createGame({ kingdom: ['Young Witch'] });
    setUpAlice(game);
    game.bob.setHand(['Hamlet', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.setPileSize('Hamlet', 0);

    await game.start();
    await playYoungWitch(game);
    game.expectDecision('chooseOneOption', 'Bob');
    await game.chooseOption('Yes');

    expect(game.bob.discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(10);
  });

  it("with Urchin as the Bane, a Mercenary is not a Bane, since it doesn't come from the Bane pile", async () => {
    forceBane('Urchin');
    const game = createGame({ kingdom: ['Young Witch'], players: ['Alice', 'Bob', 'Cara'] });
    setUpAlice(game);
    game.bob.setHand(['Mercenary', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.player('Cara').setHand(['Urchin', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await playYoungWitch(game);
    await declineReactions(game);
    // Bob isn't asked about a Bane
    game.expectDecision('chooseOneOption', 'Cara');
    await game.chooseOption('Yes');

    expect(game.bob.discard).toEqual(['Curse']);
    expect(game.player('Cara').discard).toEqual([]);
  });

  it('with no cards to draw and nothing else in hand, discards nothing and still attacks', async () => {
    forceBane('Hamlet');
    const game = createGame({ kingdom: ['Young Witch'] });
    game.alice.setHand(['Young Witch']);
    game.bob.setHand(coppers(5));

    await game.start();
    await game.playAction('Young Witch');
    await declineReactions(game);
    // The engine still asks, but only 0 cards can be chosen
    game.expectDecision('chooseCards', 'Alice');
    expect(game.pending.numSelectedEligibility).toEqual([0]);
    await game.chooseCards([]);

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.discard).toEqual([]);
    expect(game.bob.discard).toEqual(['Curse']);
  });
});
