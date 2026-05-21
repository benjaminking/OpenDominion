import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Bazaar } from '../../../src/cards/seaside/Bazaar';
import { createCardHarness } from '../testHarness';

describe('Bazaar', () => {
  it('draws 1 card, adds 2 actions, and adds $1', async () => {
    const testHarness = createCardHarness();
    const drawCard = new Copper(testHarness.sharedGameState);
    drawCard.setId('draw-copper');
    testHarness.addToDeck(drawCard);

    await new Bazaar(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.coins).toBe(1);
  });
});
