import { describe, expect, it } from 'vitest';

import { Merchant } from '../../../src/cards/base_game/Merchant';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Merchant', () => {
  it('draws 1 card and adds 1 action', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    await new Merchant(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('registers an effect for the first Silver played', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    await new Merchant(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
  });
});
