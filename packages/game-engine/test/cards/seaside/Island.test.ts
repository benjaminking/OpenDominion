import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Island } from '../../../src/cards/seaside/Island';
import { createCardHarness } from '../testHarness';

describe('Island', () => {
  it('puts a chosen hand card onto the island mat', async () => {
    const testHarness = createCardHarness();
    const handCard = new Copper(testHarness.sharedGameState);
    handCard.setId('hand-copper');
    testHarness.addToHand(handCard);

    testHarness.pickCard(handCard);
    await new Island(testHarness.sharedGameState).play(testHarness.executor);

    // chosen card moved from hand to island mat
    expect(testHarness.hand.size()).toBe(0);
  });
});
