import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Diplomat } from '../../../src/cards/intrigue/Diplomat';
import { createCardHarness } from '../testHarness';

describe('Diplomat', () => {
  it('draws 2 cards', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }

    await new Diplomat(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
  });

  it('adds 2 actions when hand size is 5 or more after drawing', async () => {
    const testHarness = createCardHarness();
    // Add 3 cards to hand (5 total after drawing 2)
    for (let i = 0; i < 3; i++) {
      const handCard = new Copper(testHarness.sharedGameState);
      handCard.setId(`hand-copper-${String(i)}`);
      testHarness.addToHand(handCard);
    }
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }

    await new Diplomat(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
  });

  it('does not add actions when hand size is below 5', async () => {
    const testHarness = createCardHarness();
    // Start with 1 card in hand, draw 2 → 3 total < 5
    const handCard = new Copper(testHarness.sharedGameState);
    handCard.setId('hand-copper-0');
    testHarness.addToHand(handCard);
    for (let i = 0; i < 2; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }

    await new Diplomat(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(0);
  });
});
