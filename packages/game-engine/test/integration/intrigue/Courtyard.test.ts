import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Courtyard', () => {
  it('must put a card back, which can be one that was not just drawn', async () => {
    const game = createGame({ kingdom: ['Courtyard'] });
    game.alice.setHand(['Courtyard', 'Estate', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', 'Copper', 'Duchy']);

    await game.start();
    await game.playAction('Courtyard');
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(false);
    await game.chooseCard('Estate');

    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Gold', 'Copper']);
    expect(game.alice.deck).toEqual(['Estate', 'Duchy']);
  });

  it('draws only what is left when the deck and discard pile run out', async () => {
    const game = createGame({ kingdom: ['Courtyard'] });
    game.alice.setHand(['Courtyard']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Courtyard');
    await game.chooseCard('Gold');

    expect(game.alice.hand).toEqual(['Silver']);
    expect(game.alice.deck).toEqual(['Gold']);
  });

  it('does nothing more with nothing to draw and an empty hand', async () => {
    const game = createGame({ kingdom: ['Courtyard'] });
    game.alice.setHand(['Courtyard']);

    await game.start();
    await game.playAction('Courtyard');

    expect(game.alice.deck).toEqual([]);
    game.expectDecision(['treasurePhase', 'buyPhase'], 'Alice');
  });

  it('lets the second play by Throne Room draw the card the first play put back', async () => {
    const game = createGame({ kingdom: ['Courtyard', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Courtyard']);
    game.alice.setDeck(['Gold', 'Copper', 'Copper', 'Silver', 'Silver', 'Estate']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Courtyard');
    // The second play draws Gold, Silver, Silver
    await game.chooseCard('Gold');
    await game.chooseCard('Copper');
    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Gold', 'Silver', 'Silver']);
    expect(game.alice.deck).toEqual(['Copper', 'Estate']);
  });

  it('can put back a card drawn after a mid-draw reshuffle, on top of the new deck', async () => {
    const game = createGame({ kingdom: ['Courtyard'] });
    game.alice.setHand(['Courtyard', 'Copper']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold', 'Gold', 'Estate']);

    await game.start();
    await game.playAction('Courtyard');
    // Drew Silver, then 2 of the 3 shuffled cards; 1 card is left in the deck
    expect(game.alice.hand).toHaveLength(4);
    expect(game.alice.deck).toHaveLength(1);
    await game.chooseCard('Silver');

    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.alice.deck).toHaveLength(2);
    expect(game.alice.discard).toEqual([]);
  });
});
