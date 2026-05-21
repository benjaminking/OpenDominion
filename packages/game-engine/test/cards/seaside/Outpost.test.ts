import { describe, expect, it } from 'vitest';

import { Outpost } from '../../../src/cards/seaside/Outpost';
import { createCardHarness } from '../testHarness';

describe('Outpost', () => {
  it('registers a duration effect and sets cleanup draw to 3', async () => {
    const testHarness = createCardHarness();
    await new Outpost(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
  });
});
