import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Tactician } from '../../../src/cards/seaside/Tactician';
import { createCardHarness } from '../testHarness';

describe('Tactician', () => {
  it('discards the hand and registers a duration effect when hand is non-empty', async () => {
    const testHarness = createCardHarness();
    const handCard = new Copper(testHarness.sharedGameState);
    handCard.setId('hand-copper');
    testHarness.addToHand(handCard);

    await new Tactician(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(1);
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
  });

  it('does not register an effect when hand is empty', async () => {
    const testHarness = createCardHarness();
    await new Tactician(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.effects.addEffect).not.toHaveBeenCalled();
  });
});
