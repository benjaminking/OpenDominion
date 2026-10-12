import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Smithy', () => {
  it('draws the last card of the deck, then shuffles the discard pile to draw the rest', async () => {
    const game = createGame({ kingdom: ['Smithy'] });
    game.alice.setHand(['Smithy', 'Copper']);
    game.alice.setDeck(['Gold']);
    game.alice.setDiscard(['Silver', 'Silver', 'Estate']);

    await game.start();
    await game.playAction('Smithy');

    expect(game.alice.hand.slice(0, 2)).toEqual(['Copper', 'Gold']);
    expect(game.alice.hand).toHaveLength(4);
    expect([...game.alice.hand.slice(2), ...game.alice.deck].sort()).toEqual(['Estate', 'Silver', 'Silver']);
    expect(game.alice.discard).toEqual([]);
  });

  it('draws only the 2 cards there are when the deck and discard pile have 2 between them', async () => {
    const game = createGame({ kingdom: ['Smithy'] });
    game.alice.setHand(['Smithy', 'Copper']);
    game.alice.setDeck(['Gold']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Smithy');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Gold', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
  });

  it('draws nothing when the deck and discard pile are both empty', async () => {
    const game = createGame({ kingdom: ['Smithy'] });
    game.alice.setHand(['Smithy', 'Copper']);

    await game.start();
    await game.playAction('Smithy');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.inPlay).toEqual(['Smithy']);
  });
});
