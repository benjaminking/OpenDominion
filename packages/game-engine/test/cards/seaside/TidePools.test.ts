import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { TidePools } from '../../../src/cards/seaside/TidePools';
import { EndOfPlayersNextTurnEffectExpiration } from '../../../src/effects/StandardEffectExpirations';
import { createCardHarness } from '../testHarness';

describe('TidePools', () => {
  it('draws 3 cards, adds 1 action, and registers a duration effect', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }

    await new TidePools(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
    expect(testHarness.effects.addEffect.mock.calls[0][0].getExpiration()).toBeInstanceOf(
      EndOfPlayersNextTurnEffectExpiration,
    );
  });
});
