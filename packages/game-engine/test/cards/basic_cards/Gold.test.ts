import { describe, expect, it } from 'vitest';

import { Gold } from '../../../src/cards/basic_cards/Gold';
import { createCardHarness } from '../testHarness';

describe('Gold', () => {
  it('is a simple treasure worth 3 coins', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);

    expect(gold.isSimpleTreasure()).toBe(true);
    expect(gold.getCoins()).toBe(3);
    expect(gold.getName()).toBe('Gold');
  });

  it('adds 3 coins when played', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);

    await gold.play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(3);
  });
});
