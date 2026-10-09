import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { SirDestry } from '../../../src/cards/dark_ages/SirDestry';
import { createCardHarness } from '../testHarness';

describe('SirDestry', () => {
  it('gives +2 Cards, then makes each other player trash a revealed card costing $3-$6', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    const sirDestry = new SirDestry(testHarness.sharedGameState);
    sirDestry.setId('sir-destry-in-play');
    testHarness.addToInPlay(sirDestry);
    for (let i = 0; i < 3; i++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(i)}`);
      testHarness.addToDeck(deckCopper);
    }
    const targetCopper = new Copper(targetHarness.sharedGameState);
    targetCopper.setId('copper-target-deck');
    targetHarness.addToDeck(targetCopper);
    const targetSilver = new Silver(targetHarness.sharedGameState);
    targetSilver.setId('silver-target-deck');
    targetHarness.addToDeck(targetSilver);

    await sirDestry.play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(0);
    expect(targetHarness.sharedTrash.asCardArray().map((card) => card.getId())).toEqual(['silver-target-deck']);
    expect(targetHarness.deck.size()).toBe(0);
  });
});
