import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Potion', () => {
  it('is only in the Supply when a Kingdom card costs a Potion, with 16 cards', () => {
    expect(createGame().hasPile('Potion')).toBe(false);
    expect(createGame({ kingdom: ['Golem'] }).pileSize('Potion')).toBe(16);
  });

  it('gives a Potion each time Tiara plays it, enough to buy two Potion-cost cards', async () => {
    const game = createGame({ kingdom: ['Tiara', 'Golem', 'Familiar'] });
    game.alice.setHand(['Tiara', 'Potion', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Potion');
    await game.playAllTreasures();
    expect(game.alice.potions).toBe(2);
    expect(game.alice.coins).toBe(7);
    await game.buy('Golem');
    await game.declineEffects();
    expect(game.alice.potions).toBe(1);
    await game.buy('Familiar');
    await game.declineEffects();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Golem', 'Familiar']));
  });

  it("can't buy a Potion-cost card without a Potion in play", async () => {
    const game = createGame({ kingdom: ['Golem'] });
    game.alice.setHand(['Gold', 'Gold', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(7);
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).not.toContain('Golem');
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toContain('Potion');
  });

  it('has 16 cards with 3 or 4 players, and only one pile when several Kingdom cards cost a Potion', () => {
    expect(createGame({ kingdom: ['Golem'], players: ['Alice', 'Bob', 'Cara'] }).pileSize('Potion')).toBe(16);
    expect(createGame({ kingdom: ['Golem'], players: ['Alice', 'Bob', 'Cara', 'Dan'] }).pileSize('Potion')).toBe(16);
    const game = createGame({ kingdom: ['Golem', 'Familiar', 'Alchemist'] });
    expect(game.pileSize('Potion')).toBe(16);
    expect(game.state.piles.supplyPiles.pileNames.filter((name) => name === 'Potion')).toHaveLength(1);
  });

  it("can't be used to pay $ costs: with $2 and a Potion, a $3-Potion card can't be bought", async () => {
    const game = createGame({ kingdom: ['Familiar', 'Golem'] });
    game.alice.setHand(['Potion', 'Copper', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(2);
    expect(game.alice.potions).toBe(1);
    const offered = game.pending.cardChoices.map((choice) => choice.card.name);
    expect(offered).not.toContain('Familiar');
    expect(offered).not.toContain('Golem');
    expect(offered).toContain('Estate');
  });
});
