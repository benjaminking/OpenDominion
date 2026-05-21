import { describe, expect, it } from 'vitest';

import { Silver } from '../../../src/cards/basic_cards/Silver';
import { createCardHarness } from '../testHarness';

describe('Silver', () => {
  it('is a simple treasure worth 2 coins', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);

    expect(silver.isSimpleTreasure()).toBe(true);
    expect(silver.getCoins()).toBe(2);
    expect(silver.getName()).toBe('Silver');
  });

  it('adds 2 coins when played', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);

    await silver.play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
  });
});
