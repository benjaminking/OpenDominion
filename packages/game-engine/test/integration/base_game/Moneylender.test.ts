import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

describe('Moneylender', () => {
  it('asks nothing and gives nothing when there is no Copper in hand', async () => {
    const game = createGame({ kingdom: ['Moneylender'] });
    game.alice.setHand(['Moneylender', 'Silver', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Moneylender');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.coins).toBe(0);
    expect(game.trash).toEqual([]);
  });

  it('offers only Coppers, and trashing one is optional', async () => {
    const game = createGame({ kingdom: ['Moneylender'] });
    game.alice.setHand(['Moneylender', 'Copper', 'Silver', 'Estate', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Moneylender');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.noneAllowed).toBe(true);
    expect(new Set(decision.cardChoices.map((choice) => choice.card.name))).toEqual(new Set(['Copper']));
    await game.chooseNone();

    expect(game.alice.coins).toBe(0);
    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Estate', 'Copper']);
  });

  it('gives +$3 only for the play that actually trashes a Copper when played twice', async () => {
    const game = createGame({ kingdom: ['Moneylender', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Moneylender', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Moneylender');
    await game.chooseCard('Copper');

    // The second play finds no Copper to trash, so nothing is asked
    expect(game.pending.kind).toBe('buyPhase');
    expect(game.trash).toEqual(['Copper']);
    expect(game.alice.coins).toBe(3);
  });

  it('trashes a Copper on each play when played twice by Throne Room with two Coppers', async () => {
    const game = createGame({ kingdom: ['Moneylender', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Moneylender', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Moneylender');
    await game.chooseCard('Copper');
    await game.chooseCard('Copper');

    expect(game.trash).toEqual(['Copper', 'Copper']);
    expect(game.alice.coins).toBe(6);
    expect(game.alice.hand).toEqual(['Estate']);
  });

  it('still gives +$3 when the trashed Copper triggers a Market Square', async () => {
    const game = createGame({ kingdom: ['Moneylender', 'Market Square'] });
    game.alice.setHand(['Moneylender', 'Market Square', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Moneylender');
    await game.chooseCard('Copper');
    await game.chooseEffect('Market Square');

    expect(game.trash).toEqual(['Copper']);
    expect(game.alice.coins).toBe(3);
    expect(game.alice.discard.sort()).toEqual(['Gold', 'Market Square']);
  });
});
