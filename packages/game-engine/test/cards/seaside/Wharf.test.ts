import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Wharf } from '../../../src/cards/seaside/Wharf';
import { createCardHarness } from '../testHarness';

describe('Wharf', () => {
  it('draws 2 cards, adds 1 buy, and registers a duration effect', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }

    await new Wharf(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
  });
});
