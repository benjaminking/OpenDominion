import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Courtyard } from '../../../src/cards/intrigue/Courtyard';
import { createCardHarness } from '../testHarness';

describe('Courtyard', () => {
  it('draws 3 cards and topdecks one', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }
    const topDeckCard = new Copper(testHarness.sharedGameState);
    topDeckCard.setId('top-deck-copper');
    testHarness.addToDeck(topDeckCard); // top of deck → drawn first

    // Courtyard draws 3 (top, c3, c2), then picks 'top' to topdeck
    testHarness.pickCard(topDeckCard);
    await new Courtyard(testHarness.sharedGameState).play(testHarness.executor);

    // Drew 3, topdecked 1 → hand = 2, deck = 2 + 1 = 3
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(3);
  });
});
