import { describe, expect, it } from 'vitest';

import { Market } from '../../../src/cards/base_game/Market';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Market', () => {
  it('draws 1 card, adds 1 action, 1 buy, and 1 coin', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Market(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(2);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });
});
