import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Copper', () => {
  it('is a simple treasure worth 1 coin', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);

    expect(copper.isSimpleTreasure()).toBe(true);
    expect(copper.getCoins()).toBe(1);
    expect(copper.getName()).toBe('Copper');
  });

  it('adds 1 coin when played', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);

    await copper.play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
  });
});
