import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Warehouse } from '../../../src/cards/seaside/Warehouse';
import { createCardHarness } from '../testHarness';

describe('Warehouse', () => {
  it('draws 3 cards, adds 1 action, then discards 3 chosen cards', async () => {
    const testHarness = createCardHarness();
    const deckCards: Copper[] = [];
    for (let i = 0; i < 5; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      deckCards.push(deckCard);
      testHarness.addToDeck(deckCard);
    }

    // After drawing 3, choose 3 to discard (the 3 drawn)
    testHarness.pickCards([deckCards[4], deckCards[3], deckCards[2]]); // top 3 cards drawn
    await new Warehouse(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.size()).toBe(0); // drew 3, discarded all 3
    expect(testHarness.discard.size()).toBe(3);
    expect(testHarness.deck.size()).toBe(2);
  });
});
