import { describe, expect, it } from 'vitest';

import { MerchantShip } from '../../../src/cards/seaside/MerchantShip';
import { EndOfPlayersNextTurnEffectExpiration } from '../../../src/effects/StandardEffectExpirations';
import { createCardHarness } from '../testHarness';

describe('MerchantShip', () => {
  it('adds $2 and registers a duration effect', async () => {
    const testHarness = createCardHarness();
    await new MerchantShip(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
    expect(testHarness.effects.addEffect.mock.calls[0][0].getExpiration()).toBeInstanceOf(
      EndOfPlayersNextTurnEffectExpiration,
    );
  });
});
