import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe('The start of a turn', () => {
  it("gives the first player's first turn 1 Action, 1 Buy, $0 and no Potions", async () => {
    const game = createGame({ kingdom: ['Golem', 'Village'], resetStatisticsBeforeStart: false });
    game.alice.setHand(['Village', 'Potion', 'Copper', 'Copper', 'Copper']);

    await game.start();

    game.expectDecision('actionPhase', 'Alice');
    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(1);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.potions).toBe(0);
  });

  it("gives every player's first turn 1 Action, 1 Buy and $0 in a 3-player game", async () => {
    const game = createGame({ kingdom: ['Festival'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Festival', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setHand(copies('Copper', 5));
    game.bob.setDeck(copies('Copper', 10));
    game.player('Cara').setHand(copies('Copper', 5));

    await game.start();
    await game.playAction('Festival');
    await game.endTurn();

    for (const name of ['Bob', 'Cara']) {
      expect(game.currentPlayerName).toBe(name);
      expect(game.player(name).actions).toBe(1);
      expect(game.player(name).buys).toBe(1);
      expect(game.player(name).coins).toBe(0);
      await game.endTurn();
    }
  });

  it("doesn't carry unspent $, Potions, Actions or Buys over to the next turn", async () => {
    const game = createGame({ kingdom: ['Golem', 'Festival'] });
    game.alice.setHand(['Festival', 'Potion', 'Gold', 'Copper', 'Estate']);
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setHand(copies('Estate', 5));
    game.bob.setDeck(copies('Estate', 10));

    await game.start();
    await game.playAction('Festival');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(6);
    expect(game.alice.potions).toBe(1);
    expect(game.alice.buys).toBe(2);
    await game.endBuyPhase();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.coins).toBe(0);
    expect(game.bob.potions).toBe(0);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(1);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.potions).toBe(0);
  });
});
