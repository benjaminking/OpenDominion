import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Smithy', () => {
  it('draws 3 cards', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Smithy(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.deck.size()).toBe(2);
  });
});
