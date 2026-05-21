import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { TradingPost } from '../../../src/cards/intrigue/TradingPost';
import { createCardHarness } from '../testHarness';

describe('TradingPost', () => {
  it('trashes 2 cards and gains a Silver to hand', async () => {
    const testHarness = createCardHarness();
    const firstHandCard = new Copper(testHarness.sharedGameState);
    firstHandCard.setId('first-hand-copper');
    const secondHandCard = new Copper(testHarness.sharedGameState);
    secondHandCard.setId('second-hand-copper');
    testHarness.addToHand(firstHandCard);
    testHarness.addToHand(secondHandCard);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-in-supply');
    testHarness.addSupplyPile(silver);

    testHarness.pickCards([firstHandCard, secondHandCard]);
    await new TradingPost(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(2);
    expect(testHarness.hand.size()).toBe(1); // Silver gained to hand
    expect(testHarness.hand.asCardArray()[0].getName()).toBe('Silver');
  });

  it('does not gain a Silver if fewer than 2 cards trashed', async () => {
    const testHarness = createCardHarness();
    // default: pickCards returns empty
    await new TradingPost(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.hand.size()).toBe(0);
  });
});
