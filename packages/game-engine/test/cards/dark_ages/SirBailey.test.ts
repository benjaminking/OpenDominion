import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { SirBailey } from '../../../src/cards/dark_ages/SirBailey';
import { createCardHarness } from '../testHarness';

describe('SirBailey', () => {
  it('gives +1 Card and +1 Action, then makes each other player trash a revealed card costing $3-$6', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    const sirBailey = new SirBailey(testHarness.sharedGameState);
    sirBailey.setId('sir-bailey-in-play');
    testHarness.addToInPlay(sirBailey);
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);
    const targetCopper = new Copper(targetHarness.sharedGameState);
    targetCopper.setId('copper-target-deck');
    targetHarness.addToDeck(targetCopper);
    const targetSilver = new Silver(targetHarness.sharedGameState);
    targetSilver.setId('silver-target-deck');
    targetHarness.addToDeck(targetSilver);

    await sirBailey.play(testHarness.executor);

    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['copper-deck-0']);
    expect(testHarness.stats.actions).toBe(1);
    expect(targetHarness.sharedTrash.asCardArray().map((card) => card.getId())).toEqual(['silver-target-deck']);
    expect(targetHarness.deck.size()).toBe(0);
    expect(testHarness.inPlay.asCardArray().map((card) => card.getId())).toEqual(['sir-bailey-in-play']);
  });
});
