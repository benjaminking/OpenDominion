import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Necropolis } from '../../../src/cards/dark_ages/Necropolis';
import { createCardHarness } from '../testHarness';

describe('Necropolis', () => {
  it('is an Action-Shelter that gives +2 Actions', async () => {
    const testHarness = createCardHarness();
    const necropolis = new Necropolis(testHarness.sharedGameState);

    await necropolis.play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(necropolis.hasType(CardType.ACTION)).toBe(true);
    expect(necropolis.hasType(CardType.SHELTER)).toBe(true);
  });
});
