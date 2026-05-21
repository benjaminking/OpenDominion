import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Pawn } from '../../../src/cards/intrigue/Pawn';
import { createCardHarness } from '../testHarness';

describe('Pawn', () => {
  it('draws 1 card and adds 1 action when those options are chosen', async () => {
    const testHarness = createCardHarness();
    const deckCard = new Copper(testHarness.sharedGameState);
    deckCard.setId('deck-copper-0');
    testHarness.addToDeck(deckCard);

    testHarness.pickOptions(['+1 Card', '+1 Action']);
    await new Pawn(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('adds 1 buy and 1 coin when those options are chosen', async () => {
    const testHarness = createCardHarness();
    testHarness.pickOptions(['+1 Buy', '+ $1']);
    await new Pawn(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });
});
