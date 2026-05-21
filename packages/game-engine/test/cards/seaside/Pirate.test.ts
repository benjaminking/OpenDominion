import { describe, expect, it } from 'vitest';

import { Pirate } from '../../../src/cards/seaside/Pirate';
import { createCardHarness } from '../testHarness';

describe('Pirate', () => {
  it('registers a duration effect to gain a treasure next turn', async () => {
    const testHarness = createCardHarness();
    await new Pirate(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
  });
});
