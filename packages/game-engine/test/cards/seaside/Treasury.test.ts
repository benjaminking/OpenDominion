import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Treasury } from '../../../src/cards/seaside/Treasury';
import { createCardHarness } from '../testHarness';

describe('Treasury', () => {
  it('draws 1 card, adds 1 action, and adds $1', async () => {
    const testHarness = createCardHarness();
    const drawCard = new Copper(testHarness.sharedGameState);
    drawCard.setId('draw-copper');
    testHarness.addToDeck(drawCard);

    await new Treasury(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });
});
