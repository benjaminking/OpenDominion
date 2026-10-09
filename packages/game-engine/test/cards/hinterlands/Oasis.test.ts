import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Oasis } from '../../../src/cards/hinterlands/Oasis';
import { createCardHarness } from '../testHarness';

describe('Oasis', () => {
  it('draws a card, adds an action and $1, then discards a card', async () => {
    const testHarness = createCardHarness();
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    testHarness.pickCard(handEstate);
    await new Oasis(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['copper-deck-0']);
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['estate-hand-0']);
  });

  it('still gives its bonuses with nothing to draw or discard', async () => {
    const testHarness = createCardHarness();

    await new Oasis(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.discard.size()).toBe(0);
  });
});
