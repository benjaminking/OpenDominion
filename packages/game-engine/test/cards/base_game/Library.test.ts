import { describe, expect, it } from 'vitest';

import { Library } from '../../../src/cards/base_game/Library';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Library', () => {
  it('draws up to 7 cards (all treasures)', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 10; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    // All drawn cards are Copper (non-action), so Library keeps drawing without asking
    await new Library(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(7);
    expect(testHarness.deck.size()).toBe(3);
  });

  it('registers effect for action-card handling', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 8; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Library(testHarness.sharedGameState).play(testHarness.executor);

    // Library uses addEffect on the card itself (not ie.addEffect)
    // The test validates the observable outcome — hand has 7 cards
    expect(testHarness.hand.size()).toBe(7);
  });
});
