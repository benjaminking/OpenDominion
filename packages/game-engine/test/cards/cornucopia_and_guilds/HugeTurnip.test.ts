import { describe, expect, it } from 'vitest';

import { HugeTurnip } from '../../../src/cards/cornucopia_and_guilds/HugeTurnip';
import { createCardHarness } from '../testHarness';

describe('HugeTurnip', () => {
  it('gives +2 Coffers and then +$1 per Coffers', async () => {
    const testHarness = createCardHarness();
    testHarness.stats.coffers = 3;

    await new HugeTurnip(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coffers).toBe(5);
    expect(testHarness.stats.coins).toBe(5);
  });

  it('gives +$2 when there were no Coffers before', async () => {
    const testHarness = createCardHarness();

    await new HugeTurnip(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coffers).toBe(2);
    expect(testHarness.stats.coins).toBe(2);
  });
});
