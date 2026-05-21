import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Salvager } from '../../../src/cards/seaside/Salvager';
import { createCardHarness } from '../testHarness';

describe('Salvager', () => {
  it('adds 1 buy, trashes a hand card, and adds coins equal to its cost', async () => {
    const testHarness = createCardHarness();
    const handCard = new Copper(testHarness.sharedGameState);
    handCard.setId('hand-copper');
    testHarness.addToHand(handCard);

    testHarness.pickCard(handCard);
    await new Salvager(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.sharedTrash.size()).toBe(1);
    // Copper costs $0, so no coins added
    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.hand.size()).toBe(0);
  });
});
