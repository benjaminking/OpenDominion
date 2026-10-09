import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { RuinedVillage } from '../../../src/cards/dark_ages/RuinedVillage';
import { createCardHarness } from '../testHarness';

describe('RuinedVillage', () => {
  it('gives +1 Action', async () => {
    const testHarness = createCardHarness();

    await new RuinedVillage(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.buys).toBe(0);
    expect(testHarness.hand.size()).toBe(0);
  });

  it('is an Action-Ruins from the Ruins pile', () => {
    const testHarness = createCardHarness();
    const ruinedVillage = new RuinedVillage(testHarness.sharedGameState);

    expect(ruinedVillage.hasType(CardType.ACTION)).toBe(true);
    expect(ruinedVillage.hasType(CardType.RUINS)).toBe(true);
    expect(ruinedVillage.getPileName()).toBe('Ruins');
  });
});
