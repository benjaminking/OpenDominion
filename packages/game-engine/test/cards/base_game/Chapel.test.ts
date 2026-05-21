import { describe, expect, it } from 'vitest';

import { Chapel } from '../../../src/cards/base_game/Chapel';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Chapel', () => {
  it('trashes chosen cards from hand', async () => {
    const testHarness = createCardHarness();
    const firstHandCopper = new Copper(testHarness.sharedGameState);
    firstHandCopper.setId('copper-hand-1');
    const secondHandCopper = new Copper(testHarness.sharedGameState);
    secondHandCopper.setId('copper-hand-2');
    const thirdHandCopper = new Copper(testHarness.sharedGameState);
    thirdHandCopper.setId('copper-hand-3');
    testHarness.addToHand(firstHandCopper);
    testHarness.addToHand(secondHandCopper);
    testHarness.addToHand(thirdHandCopper);

    testHarness.pickCards([firstHandCopper, secondHandCopper]);
    await new Chapel(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.sharedTrash.size()).toBe(2);
  });

  it('trashes nothing when no cards are chosen', async () => {
    const testHarness = createCardHarness();
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-1');
    testHarness.addToHand(handCopper);

    // default: pickCards returns empty
    await new Chapel(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });
});
