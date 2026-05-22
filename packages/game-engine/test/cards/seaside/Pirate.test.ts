import { describe, expect, it } from 'vitest';

import { Pirate } from '../../../src/cards/seaside/Pirate';
import { EndOfPlayersNextTurnEffectExpiration } from '../../../src/effects/StandardEffectExpirations';
import { createCardHarness } from '../testHarness';

describe('Pirate', () => {
  it('registers a duration effect to gain a treasure next turn', async () => {
    const testHarness = createCardHarness();
    await new Pirate(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
    expect(testHarness.effects.addEffect.mock.calls[0][0].getExpiration()).toBeInstanceOf(
      EndOfPlayersNextTurnEffectExpiration,
    );
  });
});
