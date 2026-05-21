import { describe, expect, it } from 'vitest';

import { Monument } from '../../../src/cards/prosperity/Monument';
import { createCardHarness } from '../testHarness';

describe('Monument', () => {
  it('adds $2 and +1 VP', async () => {
    const testHarness = createCardHarness();
    await new Monument(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.stats.vp).toBe(1);
  });
});
