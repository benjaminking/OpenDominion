import { describe, expect, it } from 'vitest';

import { Astrolabe } from '../../../src/cards/seaside/Astrolabe';
import { EndOfPlayersNextTurnEffectExpiration } from '../../../src/effects/StandardEffectExpirations';
import { createCardHarness } from '../testHarness';

describe('Astrolabe', () => {
  it('adds $1 and +1 buy when played', async () => {
    const testHarness = createCardHarness();
    await new Astrolabe(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.stats.buys).toBe(1);
  });

  it('registers a duration effect', async () => {
    const testHarness = createCardHarness();
    await new Astrolabe(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
    expect(testHarness.effects.addEffect.mock.calls[0][0].getExpiration()).toBeInstanceOf(
      EndOfPlayersNextTurnEffectExpiration,
    );
  });
});
