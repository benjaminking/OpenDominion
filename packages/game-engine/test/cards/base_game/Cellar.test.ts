import { describe, expect, it } from 'vitest';

import { Cellar } from '../../../src/cards/base_game/Cellar';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Cellar', () => {
  it('adds 1 action', async () => {
    const testHarness = createCardHarness();
    await new Cellar(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('discards chosen cards and draws that many', async () => {
    const testHarness = createCardHarness();
    const firstHandCopper = new Copper(testHarness.sharedGameState);
    firstHandCopper.setId('copper-hand-1');
    const secondHandCopper = new Copper(testHarness.sharedGameState);
    secondHandCopper.setId('copper-hand-2');
    const thirdHandCopper = new Copper(testHarness.sharedGameState);
    thirdHandCopper.setId('copper-hand-3');
    testHarness.addToHand(firstHandCopper);
    testHarness.addToHand(secondHandCopper);
    testHarness.addToHand(thirdHandCopper);
    for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    testHarness.pickCards([firstHandCopper, secondHandCopper]);
    await new Cellar(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(3);
    // 3 in hand - 2 discarded + 2 drawn
    expect(testHarness.hand.size()).toBe(3);
  });
});
