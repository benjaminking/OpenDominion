import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { WishingWell } from '../../../src/cards/intrigue/WishingWell';
import { createCardHarness } from '../testHarness';

describe('WishingWell', () => {
  it('draws 1 card and adds 1 action', async () => {
    const testHarness = createCardHarness();
    const drawCard = new Copper(testHarness.sharedGameState);
    drawCard.setId('draw-copper');
    testHarness.addToDeck(drawCard);

    await new WishingWell(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('draws the top card when the same card object is both guessed and on top', async () => {
    const testHarness = createCardHarness();
    // topCard added first → lower in deck
    const topDeckCard = new Copper(testHarness.sharedGameState);
    topDeckCard.setId('top-deck-copper');
    testHarness.addToDeck(topDeckCard);
    // draw added second → top of deck, drawn first by drawCards(1)
    const firstDrawCard = new Copper(testHarness.sharedGameState);
    firstDrawCard.setId('first-draw-copper');
    testHarness.addToDeck(firstDrawCard);

    // After drawCards(1): draw is in hand, topCard is now top of deck
    // Supply the topCard itself as the guess; equals() is ID-based
    testHarness.addSupplyPile(topDeckCard);
    testHarness.pickCard(topDeckCard); // guess the same card object that's on top of deck
    await new WishingWell(testHarness.sharedGameState).play(testHarness.executor);

    // Drew 1 (draw) + topCard drawn via match = 2
    expect(testHarness.hand.size()).toBe(2);
  });
});
