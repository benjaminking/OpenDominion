import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Mill } from '../../../src/cards/intrigue/Mill';
import { createCardHarness } from '../testHarness';

describe('Mill', () => {
  it('draws 1 card and adds 1 action', async () => {
    const testHarness = createCardHarness();
    const deckCard = new Copper(testHarness.sharedGameState);
    deckCard.setId('deck-copper-0');
    testHarness.addToDeck(deckCard);

    await new Mill(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('discards 2 cards for +$2', async () => {
    const testHarness = createCardHarness();
    const drawCard = new Copper(testHarness.sharedGameState);
    drawCard.setId('draw-copper');
    testHarness.addToDeck(drawCard);
    const firstHandCard = new Copper(testHarness.sharedGameState);
    firstHandCard.setId('first-hand-copper');
    const secondHandCard = new Copper(testHarness.sharedGameState);
    secondHandCard.setId('second-hand-copper');
    testHarness.addToHand(firstHandCard);
    testHarness.addToHand(secondHandCard);

    testHarness.pickCards([firstHandCard, secondHandCard]);
    await new Mill(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.stats.coins).toBe(2);
  });

  it('scores 1 VP', () => {
    const testHarness = createCardHarness();
    expect(new Mill(testHarness.sharedGameState).score([])).toBe(1);
  });
});
