import { describe, expect, it } from 'vitest';

import { Laboratory } from '../../../src/cards/base_game/Laboratory';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Laboratory', () => {
  it('draws 2 cards and adds 1 action', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Laboratory(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(2);
    expect(testHarness.stats.actions).toBe(1);
  });
});
