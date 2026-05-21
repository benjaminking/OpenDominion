import { describe, expect, it } from 'vitest';

import { Moat } from '../../../src/cards/base_game/Moat';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Moat', () => {
  it('draws 2 cards', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Moat(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(2);
  });
});
