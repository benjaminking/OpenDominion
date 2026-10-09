import { describe, expect, it } from 'vitest';

import { CandlestickMaker } from '../../../src/cards/cornucopia_and_guilds/CandlestickMaker';
import { createCardHarness } from '../testHarness';

describe('CandlestickMaker', () => {
  it('gives +1 Action, +1 Buy and +1 Coffers', async () => {
    const testHarness = createCardHarness();

    await new CandlestickMaker(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coffers).toBe(1);
    expect(testHarness.stats.coins).toBe(0);
  });
});
