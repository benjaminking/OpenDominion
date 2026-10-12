import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Storeroom', () => {
  it('only gives +1 Buy when played with an otherwise empty hand', async () => {
    const game = createGame({ kingdom: ['Storeroom'] });
    game.alice.setHand(['Storeroom']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Storeroom');
    while (game.pending.kind === 'chooseCards') {
      expect(game.pending.cardChoices).toEqual([]);
      await game.chooseCards([]);
    }

    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(0);
    expect(game.alice.hand).toEqual([]);
    expect(game.alice.deck).toHaveLength(5);
  });

  it('draws back the cards it just discarded when the deck and discard pile were empty, and can discard them again', async () => {
    const game = createGame({ kingdom: ['Storeroom'] });
    game.alice.setHand(['Storeroom', 'Estate', 'Estate', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Storeroom');
    await game.chooseCards(['Estate', 'Estate']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate', 'Estate']);
    expect(game.alice.discard).toEqual([]);

    await game.chooseCards(['Estate', 'Estate', 'Copper']);

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.discard).toEqual(['Estate', 'Estate', 'Copper']);
    expect(game.alice.coins).toBe(3);
    expect(game.alice.buys).toBe(2);
  });

  it('can discard a Tunnel for cards, gaining a Gold, and still draws one card per card discarded', async () => {
    const game = createGame({ kingdom: ['Storeroom', 'Tunnel'] });
    game.alice.setHand(['Storeroom', 'Tunnel', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Storeroom');
    await game.chooseCards(['Tunnel', 'Estate']);
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');

    const coins = game.expectDecision('chooseCards', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver', 'Gold']);
    expect([...game.alice.discard].sort()).toEqual(['Estate', 'Gold', 'Tunnel']);
    expect(coins.cardChoices).toHaveLength(4);
    await game.chooseCards(['Copper']);

    expect(game.alice.coins).toBe(1);
    expect(game.alice.buys).toBe(2);
  });

  it('gives +1 Buy and both discards for each play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Storeroom', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Storeroom', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', 'Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Storeroom');
    await game.chooseCards(['Estate', 'Estate']);
    await game.chooseCards([]);
    // Second play
    await game.chooseCards([]);
    await game.chooseCards(['Copper']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Silver', 'Gold']);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.buys).toBe(3);
  });
  it('still draws one card per card discarded when a discarded Trail is played and draws first', async () => {
    const game = createGame({ kingdom: ['Storeroom', 'Trail'] });
    game.alice.setHand(['Storeroom', 'Trail', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', 'Duchy', ...COPPERS]);

    await game.start();
    await game.playAction('Storeroom');
    await game.chooseCards(['Trail', 'Estate']);
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Trail');

    // Trail drew the Silver; Storeroom then draws 2
    const coins = game.expectDecision('chooseCards', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver', 'Gold', 'Duchy']);
    expect(game.alice.inPlay).toEqual(['Storeroom', 'Trail']);
    expect(coins.cardChoices).toHaveLength(5);
    await game.chooseCards(['Duchy']);

    expect(game.alice.coins).toBe(1);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.discard).toEqual(['Estate', 'Duchy']);
  });

  it('draws the last card of the deck, then shuffles the cards it just discarded to draw the rest', async () => {
    const game = createGame({ kingdom: ['Storeroom'] });
    game.alice.setHand(['Storeroom', 'Estate', 'Estate', 'Copper']);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Storeroom');
    await game.chooseCards(['Estate', 'Estate']);

    game.expectDecision('chooseCards', 'Alice');
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Estate', 'Gold']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.deck).toHaveLength(1);
  });
});
