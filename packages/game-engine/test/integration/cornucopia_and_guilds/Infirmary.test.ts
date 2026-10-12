import { describe, expect, it } from 'vitest';

import { createGame, GameHarness, TestPlayer } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const numOwned = (player: TestPlayer, cardName: string): number =>
  [...player.hand, ...player.deck, ...player.discard, ...player.inPlay, ...player.setAside].filter(
    (name) => name === cardName,
  ).length;

// Alice plays Market (for a second Buy) and her Treasures ($10), then buys Infirmary and chooses the overpay.
const buyInfirmary = async (game: GameHarness, overpay: string): Promise<void> => {
  await game.start();
  await game.playAction('Market');
  await game.playAllTreasures();
  await game.buy('Infirmary');
  if (game.pending.kind === 'chooseFromMultipleEvents') {
    await game.chooseEffect('Infirmary');
  }
  await game.chooseOption(overpay);
};

const createInfirmaryGame = (deck: string[]): GameHarness => {
  const game = createGame({ kingdom: ['Infirmary'] });
  game.alice.setHand(['Market', 'Gold', 'Gold', 'Copper', 'Copper']);
  game.alice.setDeck(['Copper', ...deck, ...coppers(10)]);
  return game;
};

describe('Infirmary', () => {
  it('overpaying $1 plays the bought Infirmary once, and Alice owns exactly one copy of it', async () => {
    const game = createInfirmaryGame(['Estate']);

    await buyInfirmary(game, '$1');
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.coins).toBe(6);
    expect(game.pileSize('Infirmary')).toBe(9);
    expect(numOwned(game.alice, 'Infirmary')).toBe(1);

    await game.endBuyPhase();
    expect(numOwned(game.alice, 'Infirmary')).toBe(1);
  });

  it('overpaying $2 plays it twice, drawing and trashing each time', async () => {
    const game = createInfirmaryGame(['Estate', 'Curse']);

    await buyInfirmary(game, '$2');
    await game.chooseCard('Estate');
    await game.chooseCard('Curse');

    expect(game.trash).toEqual(['Estate', 'Curse']);
    expect(game.alice.coins).toBe(5);
    expect(numOwned(game.alice, 'Infirmary')).toBe(1);
  });

  it('is not played when not overpaying', async () => {
    const game = createInfirmaryGame(['Estate']);

    await buyInfirmary(game, "Don't overpay");

    expect(game.pending.kind).toBe('buyPhase');
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.coins).toBe(7);
    expect(game.alice.discard).toEqual(['Infirmary']);
  });

  it('cannot be overpaid for when gained without buying it', async () => {
    const game = createGame({ kingdom: ['Infirmary', 'Workshop'] });
    game.alice.setHand(['Workshop', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Workshop');
    await game.chooseCard('Infirmary');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.discard).toEqual(['Infirmary']);
    expect(game.alice.hand).toHaveLength(4);
  });

  it('overpaying $3 with a short deck plays it 3 times, drawing and trashing only while there are cards', async () => {
    const game = createGame({ kingdom: ['Infirmary'] });
    game.alice.setHand(['Market', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Estate']);

    await buyInfirmary(game, '$3');
    // First play: draws the Estate and may trash it
    await game.chooseCard('Estate');

    // The other two plays have nothing to draw and nothing to trash
    game.expectDecision('buyPhase', 'Alice');
    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.coins).toBe(10 - 3 - 3);
    expect(game.alice.inPlay.filter((name) => name === 'Infirmary')).toHaveLength(1);
    expect(game.alice.log.filter((line) => line === 'Alice plays Infirmary')).toHaveLength(3);
  });

  it('each play from overpaying may trash a different card, including one drawn by an earlier play', async () => {
    const game = createGame({ kingdom: ['Infirmary'] });
    game.alice.setHand(['Market', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Curse', 'Estate', ...coppers(10)]);

    await buyInfirmary(game, '$2');
    expect(game.alice.hand).toEqual(['Curse']);
    // Keep the Curse for now
    await game.chooseNone();
    expect(game.alice.hand).toEqual(['Curse', 'Estate']);
    await game.chooseCard('Curse');

    expect(game.trash).toEqual(['Curse']);
    expect(game.alice.hand).toEqual(['Estate']);
  });

  // User ruling: the overpay ability happens on gain, in an order the player chooses with Watchtower. If Watchtower
  // trashes Infirmary first, Infirmary is still played (+1 Card), but it doesn't move out of the trash.
  it('is still played from the trash, without moving, when Watchtower trashed it first', async () => {
    const game = createGame({ kingdom: ['Infirmary', 'Watchtower'] });
    game.alice.setHand(['Watchtower', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Infirmary');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Infirmary');
    }
    await game.chooseOption('$1');
    // When it is gained, Watchtower and the overpay ability resolve in the order Alice chooses
    const gainEffects = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(gainEffects.optionalEffects.map((effect) => effect.effectName)).toEqual(['Watchtower']);
    expect(gainEffects.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Infirmary']);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    // Infirmary's play: +1 Card, then it may trash a card from hand
    game.expectDecision('chooseCard', 'Alice');
    expect(game.alice.hand).toEqual(['Watchtower', 'Estate']);
    await game.chooseNone();

    expect(game.trash).toEqual(['Infirmary']);
    expect(game.alice.inPlay).not.toContain('Infirmary');
    expect(game.alice.log).toContain('Alice has lost track of Infirmary');
  });

  it('is played into play when its overpay resolves before Watchtower, which then loses track of it', async () => {
    const game = createGame({ kingdom: ['Infirmary', 'Watchtower'] });
    game.alice.setHand(['Watchtower', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Infirmary');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Infirmary');
    }
    await game.chooseOption('$1');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Infirmary');
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseNone();

    // Infirmary went into play, so it is no longer where it was gained. Watchtower is still offered, but loses track
    // of it.
    expect(game.alice.inPlay).toContain('Infirmary');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    expect(game.alice.log).toContain('Alice has lost track of Infirmary');

    // With no Buys left the turn ends, and Infirmary is discarded from play in Clean-up
    expect(game.pending.playerName).toBe('Bob');
    expect(game.alice.discard).toContain('Infirmary');
    expect(game.trash).toEqual([]);
  });

  it('overpaying with a Potion plays it only once per $ overpaid', async () => {
    const game = createGame({ kingdom: ['Infirmary', 'University'] });
    game.alice.setHand(['Market', 'Potion', 'Gold', 'Copper']);
    game.alice.setDeck(['Copper', 'Estate', 'Curse', ...coppers(10)]);

    await game.start();
    await game.playAction('Market');
    await game.playAllTreasures();
    await game.buy('Infirmary');
    if (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Infirmary');
    }
    await game.chooseOption('$1P');
    await game.chooseCard('Estate');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.trash).toEqual(['Estate']);
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.log.filter((line) => line === 'Alice plays Infirmary')).toHaveLength(1);
  });
});
