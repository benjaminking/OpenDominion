import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Sir Destry', () => {
  it('draws 2 cards, reshuffling in the middle, before attacking', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Sir Destry', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold']);
    game.bob.setDeck(['Duchy', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Destry');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver', 'Gold']);
    expect(game.trash).toEqual(['Duchy']);
  });

  it('draws only the 1 card left in deck and discard, then attacks', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Sir Destry', 'Copper', 'Copper']);
    game.alice.setDiscard(['Silver']);
    game.bob.setDeck(['Duchy', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Destry');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.trash).toEqual(['Duchy']);
  });

  it('draws nothing from an empty deck and discard pile, and still attacks', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Sir Destry', 'Copper']);
    game.bob.setDeck(['Duchy', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Destry');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.trash).toEqual(['Duchy']);
    expect(game.alice.inPlay).toEqual(['Sir Destry']);
  });
});
