import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { WorkersVillage } from '../../../src/cards/prosperity/WorkersVillage';
import { createCardHarness } from '../testHarness';

describe('WorkersVillage', () => {
  it('draws 1 card and adds 2 actions and 1 buy', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new WorkersVillage(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(0);
  });
});
