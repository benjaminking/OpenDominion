import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { SirMartin } from '../../../src/cards/dark_ages/SirMartin';
import { createCardHarness } from '../testHarness';

describe('SirMartin', () => {
  it('costs $4, unlike the other Knights', () => {
    const testHarness = createCardHarness();

    expect(new SirMartin(testHarness.sharedGameState).getCost().coins).toBe(4);
  });

  it('gives +2 Buys, then makes each other player trash a revealed card costing $3-$6', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    const sirMartin = new SirMartin(testHarness.sharedGameState);
    sirMartin.setId('sir-martin-in-play');
    testHarness.addToInPlay(sirMartin);
    const targetCopper = new Copper(targetHarness.sharedGameState);
    targetCopper.setId('copper-target-deck');
    targetHarness.addToDeck(targetCopper);
    const targetSilver = new Silver(targetHarness.sharedGameState);
    targetSilver.setId('silver-target-deck');
    targetHarness.addToDeck(targetSilver);

    await sirMartin.play(testHarness.executor);

    expect(testHarness.stats.buys).toBe(2);
    expect(testHarness.stats.actions).toBe(0);
    expect(testHarness.hand.size()).toBe(0);
    expect(targetHarness.sharedTrash.asCardArray().map((card) => card.getId())).toEqual(['silver-target-deck']);
    expect(targetHarness.deck.size()).toBe(0);
  });
});
