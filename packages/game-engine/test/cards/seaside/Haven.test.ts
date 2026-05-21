import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Haven } from '../../../src/cards/seaside/Haven';
import { createCardHarness } from '../testHarness';

describe('Haven', () => {
  it('sets aside a chosen hand card and registers a duration effect', async () => {
    const testHarness = createCardHarness();
    const handCard = new Copper(testHarness.sharedGameState);
    handCard.setId('hand-copper');
    testHarness.addToHand(handCard);

    testHarness.pickCard(handCard);
    await new Haven(testHarness.sharedGameState).play(testHarness.executor);

    // card moved from hand to set-aside
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
  });
});
