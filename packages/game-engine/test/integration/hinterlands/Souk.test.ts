import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Souk', 'Haggler', 'Village'];
const ESTATES = Array<string>(7).fill('Estate');
const COPPERS = Array<string>(10).fill('Copper');

describe('Souk', () => {
  it('can leave you with less $ than you had before playing it', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Village', 'Haggler', 'Souk', ...ESTATES]);
    game.alice.setDeck(['Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Haggler');
    expect(game.alice.coins).toBe(2);
    // 8 cards left in hand: $2 + $7 - $8
    await game.playAction('Souk');

    expect(game.alice.hand).toHaveLength(8);
    expect(game.alice.coins).toBe(1);
    expect(game.alice.buys).toBe(2);
  });

  it('cannot take you below $0, even with $ from earlier cards', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Village', 'Haggler', 'Souk', 'Estate', ...ESTATES]);
    game.alice.setDeck(['Estate', 'Estate', ...COPPERS]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Haggler');
    // 9 cards left in hand: $2 + $7 - $9 = $0
    await game.playAction('Souk');
    expect(game.alice.coins).toBe(0);
  });

  it('when bought, trashes up to 2 cards from hand', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Silver', 'Estate', 'Curse', 'Duchy']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Souk');

    const trash = game.expectDecision('chooseCards', 'Alice');
    expect(trash.numSelectedEligibility).toEqual([0, 1, 2]);
    expect(trash.cardChoices.map((choice) => choice.card.name)).toEqual(['Estate', 'Curse', 'Duchy']);
    await game.chooseCards(['Estate', 'Curse']);

    expect(game.trash).toEqual(['Estate', 'Curse']);
    expect(game.alice.discard[0]).toBe('Souk');
    expect(game.alice.discard).toContain('Duchy');
  });

  it('gives +$7 minus the hand size on each play when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Souk', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Souk');

    // ($7 - $3) twice
    expect(game.alice.coins).toBe(8);
    expect(game.alice.buys).toBe(3);
  });

  it('when gained with no cards in hand, asks nothing', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Souk');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.trash).toEqual([]);
    expect(game.alice.discard[0]).toBe('Souk');
  });

  it('when gained with one card in hand, may trash just that card', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Gold', 'Gold', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Souk');

    const trash = game.expectDecision('chooseCards', 'Alice');
    expect(trash.numSelectedEligibility).toContain(0);
    expect(trash.numSelectedEligibility).toContain(1);
    await game.chooseCards(['Estate']);

    expect(game.trash).toEqual(['Estate']);
  });

  it('when gained, lets a trashed Nomads give its +$2, which can be spent with another Buy', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Nomads', 'Festival'] });
    game.alice.setHand(['Festival', 'Gold', 'Gold', 'Nomads', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Festival');
    await game.endActionPhase();
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
    await game.buy('Souk');
    await game.chooseCards(['Nomads']);

    expect(game.trash).toEqual(['Nomads']);
    expect(game.alice.coins).toBe(6);
    await game.buy('Gold');
    expect(game.alice.discard.slice(0, 2)).toEqual(['Souk', 'Gold']);
  });
});
