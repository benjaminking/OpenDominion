import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const KINGDOM = ['Nomads', 'Chapel', 'Laboratory', 'Village'];
const COPPERS = Array<string>(10).fill('Copper');

describe('Nomads', () => {
  it('gives +$2 when bought, which can be spent on another buy', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Nomads', 'Gold', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Nomads');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(7);
    expect(game.alice.buys).toBe(2);
    await game.buy('Nomads');

    expect(game.alice.coins).toBe(5);
    await game.buy('Laboratory');
    expect(game.alice.discard.slice(0, 2)).toEqual(['Nomads', 'Laboratory']);
  });

  it('gives +$2 when trashed', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Chapel', 'Nomads', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Nomads', 'Estate']);

    expect(game.trash).toEqual(['Nomads', 'Estate']);
    expect(game.alice.coins).toBe(2);
  });

  it('gives +$2 for each Nomads trashed at once', async () => {
    const game = createGame({ kingdom: KINGDOM });
    game.alice.setHand(['Chapel', 'Nomads', 'Nomads', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Nomads', 'Nomads']);

    expect(game.trash).toEqual(['Nomads', 'Nomads']);
    expect(game.alice.coins).toBe(4);
  });

  it('gives +$2 for being gained and +$2 for being trashed when Watchtower trashes it as it is gained', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Watchtower'] });
    game.alice.setHand(['Nomads', 'Watchtower', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Nomads');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(6);
    await game.buy('Nomads');

    const order = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(order.optionalEffects.map((effect) => effect.effectName)).toEqual(['Watchtower']);
    expect(order.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Nomads']);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    // $6 - $4 + $2 (trashed) + $2 (gained, even though it has left the discard pile)
    game.expectDecision('buyPhase', 'Alice');
    expect(game.trash).toEqual(['Nomads']);
    expect(game.alice.coins).toBe(6);
    await game.buy('Gold');
    expect(game.alice.discard).toContain('Gold');
  });

  it("gives its +$2 to its owner when gained on another player's turn, which is gone by their own turn", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Militia', 'Weaver'] });
    game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Weaver', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Militia');
    await game.chooseCards(['Weaver', 'Estate']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain a card costing up to $4');
    await game.chooseCard('Nomads');

    // Bob gets the $2, not Alice
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.coins).toBe(2);
    expect(game.alice.coins).toBe(2);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(6);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.bob.coins).toBe(0);
  });

  it("gives its +$2 to its owner when another player's Swindler trashes it", async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Swindler'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Nomads', ...COPPERS]);

    await game.start();
    await game.playAction('Swindler');
    expect(game.trash).toEqual(['Nomads']);
    expect(game.bob.coins).toBe(2);
    await game.chooseCard('Smithy');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.coins).toBe(2);
    expect(game.bob.discard).toEqual(['Smithy']);
    await game.endTurn();
    expect(game.bob.coins).toBe(0);
  });

  it('gives +2 Buys and +$4 when played by Throne Room', async () => {
    const game = createGame({ kingdom: [...KINGDOM, 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Nomads', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Nomads');

    expect(game.alice.buys).toBe(3);
    expect(game.alice.coins).toBe(4);
  });
});
