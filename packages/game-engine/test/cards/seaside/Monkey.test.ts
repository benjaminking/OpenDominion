import { describe, expect, it } from 'vitest';

import { Monkey } from '../../../src/cards/seaside/Monkey';
import { createCardHarness } from '../testHarness';

describe('Monkey', () => {
  it('registers two duration effects', async () => {
    const testHarness = createCardHarness();
    await new Monkey(testHarness.sharedGameState).play(testHarness.executor);

    // one effect for GAIN trigger (draw when next player gains), one for TURN_START
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(2);
  });
});
