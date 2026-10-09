import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Courtier } from '../../../src/cards/intrigue/Courtier';
import { createCardHarness } from '../testHarness';

describe('Courtier', () => {
  it('reveals the chosen hand card and executes selected options', async () => {
    const testHarness = createCardHarness();
    // Copper has 1 type (treasure), so 1 option is chosen
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-in-hand');
    testHarness.addToHand(copper);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-in-supply');
    testHarness.addSupplyPile(gold);

    testHarness.pickCard(copper); // reveal this card
    testHarness.pickOptions(['Gain a Gold']); // choose bonus (1 type = 1 option)
    await new Courtier(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1); // gained a Gold
    expect(testHarness.discard.asCardArray()[0].getName()).toBe('Gold');
  });

  it('does nothing if no card is chosen', async () => {
    const testHarness = createCardHarness();
    // default: choice returns none
    await new Courtier(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.coins).toBe(0);
  });
});
