import { describe, expect, it } from 'vitest';

import { Bridge } from '../../../src/cards/intrigue/Bridge';
import { createCardHarness } from '../testHarness';

describe('Bridge', () => {
  it('adds 1 buy and 1 coin', async () => {
    const testHarness = createCardHarness();
    await new Bridge(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });

  it('registers a cost modifier', async () => {
    const testHarness = createCardHarness();
    await new Bridge(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.sharedGameState.addCostModifier).toHaveBeenCalledTimes(1);
  });
});
