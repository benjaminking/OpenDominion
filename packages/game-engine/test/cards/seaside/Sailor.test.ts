import { describe, expect, it } from 'vitest';

import { Sailor } from '../../../src/cards/seaside/Sailor';
import {
  EndOfPlayersNextTurnEffectExpiration,
  OnceThisTurnEffectExpiration,
} from '../../../src/effects/StandardEffectExpirations';
import { createCardHarness } from '../testHarness';

describe('Sailor', () => {
  it('adds 1 action and registers two duration effects', async () => {
    const testHarness = createCardHarness();
    await new Sailor(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    // one effect for gaining a duration card this turn, one for next-turn coins + trash
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(2);
    expect(testHarness.effects.addEffect.mock.calls[0][0].getExpiration()).toBeInstanceOf(OnceThisTurnEffectExpiration);
    expect(testHarness.effects.addEffect.mock.calls[1][0].getExpiration()).toBeInstanceOf(
      EndOfPlayersNextTurnEffectExpiration,
    );
  });
});
