import { describe, expect, it } from 'vitest';

import { Mine } from '../../../src/cards/base_game/Mine';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { createCardHarness } from '../testHarness';

describe('Mine', () => {
  it('trashes a treasure from hand and gains a better treasure to hand', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    testHarness.pickCard(copper);
    testHarness.pickCard(silver);
    await new Mine(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.hand.asCardArray()[0].getName()).toBe('Silver');
    expect(testHarness.sharedTrash.size()).toBe(1);
  });

  it('does nothing if no card is chosen', async () => {
    const testHarness = createCardHarness();
    // default: choice returns none
    await new Mine(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });
});
