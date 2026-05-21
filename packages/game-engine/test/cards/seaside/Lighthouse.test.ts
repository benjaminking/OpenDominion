import { describe, expect, it } from 'vitest';

import { Lighthouse } from '../../../src/cards/seaside/Lighthouse';
import { createCardHarness } from '../testHarness';

describe('Lighthouse', () => {
  it('adds 1 action, $1, and registers two duration effects', async () => {
    const testHarness = createCardHarness();
    await new Lighthouse(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
    // one duration effect for +$1 next turn, one for blocking attacks
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(2);
  });
});
