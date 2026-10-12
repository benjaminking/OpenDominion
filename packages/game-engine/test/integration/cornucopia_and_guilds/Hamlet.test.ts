import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Hamlet', () => {
  it('with nothing to draw and an empty hand, gives +1 Action without asking to discard', async () => {
    const game = createGame({ kingdom: ['Hamlet'] });
    game.alice.setHand(['Hamlet']);

    await game.start();
    await game.playAction('Hamlet');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(1);
  });

  it('can discard the card it drew for +1 Action, leaving nothing to discard for +1 Buy', async () => {
    const game = createGame({ kingdom: ['Hamlet'] });
    game.alice.setHand(['Hamlet']);
    game.alice.setDeck(['Estate']);

    await game.start();
    await game.playAction('Hamlet');
    expect(game.pending.noneAllowed).toBe(true);
    await game.chooseCard('Estate');

    game.expectDecision('buyPhase', 'Alice');
    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(1);
  });

  it('discarding Tunnel for +1 Action gains a Gold, and with Footpad the card that draws can be discarded for +1 Buy', async () => {
    const game = createGame({ kingdom: ['Hamlet', 'Tunnel', 'Footpad'] });
    game.alice.setHand(['Hamlet', 'Tunnel']);
    game.alice.setDeck(['Estate', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Hamlet');
    expect(game.alice.hand).toEqual(['Tunnel', 'Estate']);
    await game.chooseCard('Tunnel');
    game.expectDecision('chooseFromMultipleEvents', 'Alice');
    await game.chooseEffect('Tunnel');

    // Footpad: gaining the Gold in the Action phase draws a card
    expect(game.alice.hand).toEqual(['Estate', 'Copper']);
    expect(game.alice.actions).toBe(2);
    await game.chooseCard('Estate');

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.discard).toEqual(['Tunnel', 'Gold', 'Estate']);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(2);
  });

  it('declining the +1 Action discard still lets the only card be discarded for +1 Buy', async () => {
    const game = createGame({ kingdom: ['Hamlet'] });
    game.alice.setHand(['Hamlet']);
    game.alice.setDeck(['Estate']);

    await game.start();
    await game.playAction('Hamlet');
    await game.chooseNone();
    await game.chooseCard('Estate');

    expect(game.alice.discard).toEqual(['Estate']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(2);
  });

  it('played twice by Throne Room, can discard for +1 Action and +1 Buy each time', async () => {
    const game = createGame({ kingdom: ['Hamlet', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Hamlet', 'Estate', 'Estate']);
    game.alice.setDeck(['Curse', 'Copper', 'Silver']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Hamlet');
    await game.chooseCard('Estate');
    await game.chooseCard('Estate');
    await game.chooseCard('Curse');
    await game.chooseNone();

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.discard).toEqual(['Estate', 'Estate', 'Curse']);
    // +1 Action twice, +1 Action for two of the discards; +1 Buy for one
    expect(game.alice.actions).toBe(2 + 2);
    expect(game.alice.buys).toBe(2);
  });
});
