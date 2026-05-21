import { describe, expect, it } from 'vitest';

import { Remodel } from '../../../src/cards/base_game/Remodel';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { createCardHarness } from '../testHarness';

describe('Remodel', () => {
  it('trashes a hand card and gains a card costing up to 2 more', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    // Estate costs $2; Copper costs $0, so +2 = $2 matches
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-supply-0');
    testHarness.addSupplyPile(estate);

    testHarness.pickCard(copper); // trash
    testHarness.pickCard(estate); // gain
    await new Remodel(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.size()).toBe(1);
    expect(testHarness.discard.size()).toBe(1);
    expect(testHarness.discard.asCardArray()[0].getName()).toBe('Estate');
  });

  it('does nothing if no card is chosen to trash', async () => {
    const testHarness = createCardHarness();
    // default: choice returns none
    await new Remodel(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
  });
});
