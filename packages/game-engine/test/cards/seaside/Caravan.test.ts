import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Caravan } from '../../../src/cards/seaside/Caravan';
import { EndOfPlayersNextTurnEffectExpiration } from '../../../src/effects/StandardEffectExpirations';
import { createCardHarness } from '../testHarness';

describe('Caravan', () => {
  it('draws 1 card, adds 1 action, and registers a duration effect', async () => {
    const testHarness = createCardHarness();
    const drawCard = new Copper(testHarness.sharedGameState);
    drawCard.setId('draw-copper');
    testHarness.addToDeck(drawCard);

    await new Caravan(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
    expect(testHarness.effects.addEffect.mock.calls[0][0].getExpiration()).toBeInstanceOf(
      EndOfPlayersNextTurnEffectExpiration,
    );
  });
});
