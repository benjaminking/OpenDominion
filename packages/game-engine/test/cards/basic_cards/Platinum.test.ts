import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Platinum } from '../../../src/cards/basic_cards/Platinum';
import { createCardHarness } from '../testHarness';

describe('Platinum', () => {
  it('is a simple Treasure costing $9 and worth 5 coins', () => {
    const testHarness = createCardHarness();
    const platinum = new Platinum(testHarness.sharedGameState);

    expect(platinum.getName()).toBe('Platinum');
    expect(platinum.hasType(CardType.TREASURE)).toBe(true);
    expect(platinum.isSimpleTreasure()).toBe(true);
    expect(platinum.getCoins()).toBe(5);
    expect(platinum.getOriginalCost().coins).toBe(9);
  });

  it('adds 5 coins when played', async () => {
    const testHarness = createCardHarness();
    const platinum = new Platinum(testHarness.sharedGameState);

    await platinum.play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(5);
  });
});
