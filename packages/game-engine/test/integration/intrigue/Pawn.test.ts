import { describe, expect, it, vi } from 'vitest';

import { createGame } from '../gameHarness';

describe('Pawn', () => {
  it('asks for two different options, and can choose differently for each play by Throne Room', async () => {
    const game = createGame({ kingdom: ['Pawn', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Pawn', 'Copper']);
    game.alice.setDeck(['Silver', ...Array<string>(10).fill('Copper')]);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Pawn');

    const decision = game.expectDecision('chooseMultipleOptions', 'Alice');
    expect(decision.numToSelect).toBe(2);
    expect(decision.options).toEqual(['+1 Card', '+1 Action', '+1 Buy', '+ $1']);
    await game.chooseOptions(['+1 Card', '+1 Action']);
    await game.chooseOptions(['+1 Buy', '+ $1']);

    expect(game.alice.hand).toEqual(['Copper', 'Silver']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(1);
  });

  it('still gives the other choice when +1 Card draws nothing from an empty deck and discard pile', async () => {
    const game = createGame({ kingdom: ['Pawn'] });
    game.alice.setHand(['Pawn', 'Copper']);

    await game.start();
    await game.playAction('Pawn');
    await game.chooseOptions(['+1 Card', '+ $1']);

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.coins).toBe(1);
  });

  it('draws with a reshuffle for +1 Card', async () => {
    const game = createGame({ kingdom: ['Pawn'] });
    game.alice.setHand(['Pawn']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Pawn');
    await game.chooseOptions(['+1 Card', '+1 Buy']);

    expect(game.alice.hand).toEqual(['Gold']);
    expect(game.alice.buys).toBe(2);
  });

  it('resolves +1 Card before +1 Action, and both before +1 Buy and +$1, whatever order they were picked in', async () => {
    const game = createGame({ kingdom: ['Pawn', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Pawn', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', 'Copper', 'Copper']);

    await game.start();
    const ie = game.alice.ie;
    const drawCards = vi.spyOn(ie, 'drawCards');
    const addActions = vi.spyOn(ie, 'addActions');
    const addBuys = vi.spyOn(ie, 'addBuys');
    const addCoins = vi.spyOn(ie, 'addCoins');
    await game.playAction('Throne Room');
    await game.chooseCard('Pawn');
    await game.chooseOptions(['+1 Action', '+1 Card']);
    expect(drawCards.mock.invocationCallOrder[0]).toBeLessThan(addActions.mock.invocationCallOrder[0]);
    await game.chooseOptions(['+ $1', '+1 Buy']);
    expect(addBuys.mock.invocationCallOrder[0]).toBeLessThan(addCoins.mock.invocationCallOrder[0]);

    expect(game.alice.hand).toEqual(['Copper', 'Silver']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(1);
  });

  it('does not give the same option twice: the choices must be different', async () => {
    const game = createGame({ kingdom: ['Pawn'] });
    game.alice.setHand(['Pawn', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', 'Copper']);

    await game.start();
    await game.playAction('Pawn');
    await game.chooseOptions(['+1 Card', '+1 Card']);

    expect(game.alice.hand).toEqual(['Copper', 'Silver']);
  });
});
