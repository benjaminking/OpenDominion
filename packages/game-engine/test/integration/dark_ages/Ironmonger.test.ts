import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('Ironmonger', () => {
  it('discarding a revealed Tunnel lets it be revealed to gain a Gold, and Tunnel being a Victory card gives +1 Card', async () => {
    const game = createGame({ kingdom: ['Ironmonger', 'Tunnel'] });
    game.alice.setHand(['Ironmonger', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Tunnel', 'Silver', ...COPPERS]);
    const golds = game.pileSize('Gold');

    await game.start();
    await game.playAction('Ironmonger');
    await game.chooseOption('Yes, discard it');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');

    expect(game.pileSize('Gold')).toBe(golds - 1);
    expect(game.alice.discard).toEqual(['Tunnel', 'Gold']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.actions).toBe(1);
  });

  it('played twice by Throne Room: each play reveals the current top card', async () => {
    const game = createGame({ kingdom: ['Ironmonger', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Ironmonger', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Estate', 'Gold', 'Silver', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Ironmonger');
    // First play: draw Copper, reveal Estate and keep it, so +1 Card draws it
    await game.chooseOption('No, keep it on top');
    // Second play: draw Gold, reveal Silver and discard it for +$1
    await game.chooseOption('Yes, discard it');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Estate', 'Gold']);
    expect(game.alice.discard).toEqual(['Silver']);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.actions).toBe(2);
  });

  it.each([
    { revealed: 'Farm', kingdom: ['Farm'], actions: 1, coins: 1, drawsNext: true },
    { revealed: 'Coronet', kingdom: [], actions: 2, coins: 1, drawsNext: false },
    { revealed: 'Mill', kingdom: ['Mill'], actions: 2, coins: 0, drawsNext: true },
    { revealed: 'Dame Josephine', kingdom: ['Knights'], actions: 2, coins: 0, drawsNext: true },
    { revealed: 'Charlatan Curse', kingdom: ['Charlatan'], actions: 1, coins: 1, drawsNext: false },
    { revealed: 'Abandoned Mine', kingdom: ['Marauder'], actions: 2, coins: 0, drawsNext: false },
    { revealed: 'Necropolis', kingdom: [], actions: 2, coins: 0, drawsNext: false },
    { revealed: 'Overgrown Estate', kingdom: [], actions: 1, coins: 0, drawsNext: true },
    { revealed: 'Hovel', kingdom: [], actions: 1, coins: 0, drawsNext: false },
    { revealed: 'Curse', kingdom: [], actions: 1, coins: 0, drawsNext: false },
  ])(
    'a discarded $revealed gives a bonus for each of its Action, Treasure and Victory types',
    async ({ revealed, kingdom, actions, coins, drawsNext }) => {
      const game = createGame({ kingdom: ['Ironmonger', ...kingdom] });
      game.alice.setHand(['Ironmonger', 'Estate']);
      game.alice.setDeck(['Copper', revealed, 'Silver', ...COPPERS]);

      await game.start();
      await game.playAction('Ironmonger');
      await game.chooseOption('Yes, discard it');

      expect(game.alice.cards(CardLocation.DISCARD).map((card) => card.getName())).toEqual([revealed]);
      expect(game.alice.actions).toBe(actions);
      expect(game.alice.coins).toBe(coins);
      expect(game.alice.hand).toEqual(drawsNext ? ['Estate', 'Copper', 'Silver'] : ['Estate', 'Copper']);
    },
  );
});
