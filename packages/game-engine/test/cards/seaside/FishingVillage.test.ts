import { describe, expect, it } from 'vitest';

import { FishingVillage } from '../../../src/cards/seaside/FishingVillage';
import { EndOfPlayersNextTurnEffectExpiration } from '../../../src/effects/StandardEffectExpirations';
import { createCardHarness } from '../testHarness';

describe('FishingVillage', () => {
  it('adds 2 actions, $1, and registers a duration effect', async () => {
    const testHarness = createCardHarness();
    await new FishingVillage(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
    expect(testHarness.effects.addEffect.mock.calls[0][0].getExpiration()).toBeInstanceOf(
      EndOfPlayersNextTurnEffectExpiration,
    );
  });
});
