import { describe, expect, it } from 'vitest';

import { Moneylender } from '../../../src/cards/base_game/Moneylender';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Moneylender', () => {
  it('trashes Copper from hand and adds 3 coins', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);

    testHarness.pickCard(copper);
    await new Moneylender(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.size()).toBe(1);
    expect(testHarness.stats.coins).toBe(3);
  });

  it('does nothing when no Copper is chosen', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);

    // default: choice returns none
    await new Moneylender(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.stats.coins).toBe(0);
  });
});
