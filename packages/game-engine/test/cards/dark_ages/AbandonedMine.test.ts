import { describe, expect, it } from 'vitest';

import { AbandonedMine } from '../../../src/cards/dark_ages/AbandonedMine';
import { createCardHarness } from '../testHarness';

describe('AbandonedMine', () => {
  it('gives +$1 and nothing else', async () => {
    const testHarness = createCardHarness();

    await new AbandonedMine(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.stats.actions).toBe(0);
    expect(testHarness.stats.buys).toBe(0);
    expect(testHarness.hand.size()).toBe(0);
  });

  it('is a Ruins card in the Ruins pile', () => {
    const testHarness = createCardHarness();
    const abandonedMine = new AbandonedMine(testHarness.sharedGameState);

    expect(abandonedMine.getPileName()).toBe('Ruins');
  });
});
