import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

const offeredNames = (cardChoices: { card: { name: string } }[]): string[] =>
  cardChoices.map((choice) => choice.card.name);

describe('Costs', () => {
  it('never go below $0: with $2 off, Estate and Copper cost $0 and buying one gives no $ back', async () => {
    const game = createGame({ kingdom: ['Highway', 'Market'] });
    game.alice.setHand(['Highway', 'Highway', 'Market', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', 'Estate', 'Estate', ...copies('Copper', 10)]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAction('Market');

    expect(game.costOf('Copper').coins).toBe(0);
    expect(game.costOf('Estate').coins).toBe(0);
    expect(game.costOf('Silver').coins).toBe(1);
    const decision = game.expectDecision('buyPhase', 'Alice');
    expect(decision.numCoins).toBe(1);
    expect(offeredNames(decision.cardChoices)).toContain('Estate');
    expect(offeredNames(decision.cardChoices)).not.toContain('Smithy');
    await game.buy('Estate');

    // The Estate cost $0: the $1 is still there for a Silver
    expect(game.expectDecision('buyPhase', 'Alice').numCoins).toBe(1);
    await game.buy('Silver');

    expect(game.alice.discard).toEqual(expect.arrayContaining(['Estate', 'Silver']));
  });

  it('has no card costing $1 less than a $0 card: Develop on an Estate at $0 gains only a $1 card', async () => {
    const game = createGame({ kingdom: ['Develop', 'Highway'] });
    game.alice.setHand(['Highway', 'Highway', 'Develop', 'Estate', 'Copper']);
    game.alice.setDeck(['Copper', 'Copper', ...copies('Copper', 10)]);

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAction('Develop');
    await game.chooseCard('Estate');

    // Silver costs $1; Copper, Curse and Estate cost $0, which isn't $1 more or less than $0
    const offered = offeredNames(game.expectDecision('chooseCard', 'Alice').cardChoices);
    expect(offered).toContain('Silver');
    expect(offered).not.toContain('Copper');
    expect(offered).not.toContain('Curse');
    expect(offered).not.toContain('Estate');
    await game.chooseCard('Silver');

    // Nothing to gain for the other card
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.pending.playerName).toBe('Alice');
    expect(game.pending.kind).not.toBe('chooseCard');
  });

  it("go back to normal at the end of the turn: Bridge's reduction doesn't last into the next player's turn", async () => {
    const game = createGame({ kingdom: ['Bridge', 'Golem'] });
    game.alice.setHand(['Bridge', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Copper', 10));
    game.bob.setHand(copies('Copper', 5));
    game.bob.setDeck(copies('Copper', 10));

    await game.start();
    await game.playAction('Bridge');
    expect(game.costOf('Estate').coins).toBe(1);
    expect(game.costOf('Golem').coins).toBe(3);
    expect(game.costOf('Golem').potions).toBe(1);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.costOf('Estate').coins).toBe(2);
    expect(game.costOf('Golem').coins).toBe(4);
  });
});
