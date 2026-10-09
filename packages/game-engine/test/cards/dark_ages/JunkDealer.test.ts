import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { JunkDealer } from '../../../src/cards/dark_ages/JunkDealer';
import { createCardHarness } from '../testHarness';

describe('JunkDealer', () => {
  it('gives +1 Card, +1 Action, +$1 and trashes the chosen card from hand', async () => {
    const testHarness = createCardHarness();
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    testHarness.pickCard(handEstate);
    await new JunkDealer(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['copper-deck-0']);
    expect(testHarness.sharedTrash.asCardArray().map((card) => card.getId())).toEqual(['estate-hand-0']);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });

  it('trashes nothing when the hand is empty', async () => {
    const testHarness = createCardHarness();

    await new JunkDealer(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });
});
