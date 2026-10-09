import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { RuinedMarket } from '../../../src/cards/dark_ages/RuinedMarket';
import { createCardHarness } from '../testHarness';

describe('RuinedMarket', () => {
  it('gives +1 Buy', async () => {
    const testHarness = createCardHarness();

    await new RuinedMarket(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.actions).toBe(0);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('is an Action-Ruins from the Ruins pile', () => {
    const testHarness = createCardHarness();
    const ruinedMarket = new RuinedMarket(testHarness.sharedGameState);

    expect(ruinedMarket.hasType(CardType.ACTION)).toBe(true);
    expect(ruinedMarket.hasType(CardType.RUINS)).toBe(true);
    expect(ruinedMarket.getPileName()).toBe('Ruins');
  });
});
