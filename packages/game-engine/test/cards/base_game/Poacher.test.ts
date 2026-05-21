import { describe, expect, it } from 'vitest';

import { Poacher } from '../../../src/cards/base_game/Poacher';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Poacher', () => {
  it('draws 1 card, adds 1 action and 1 coin', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    await new Poacher(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });

  it('discards one card per empty supply pile', async () => {
    const testHarness = createCardHarness();
    // Add 2 empty piles by setting numEmptySupplyPiles
    (testHarness.sharedGameState.piles as unknown as { numEmptySupplyPiles: number }).numEmptySupplyPiles = 2;
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }
    const firstHandCopper = new Copper(testHarness.sharedGameState);
    firstHandCopper.setId('copper-hand-0');
    const secondHandCopper = new Copper(testHarness.sharedGameState);
    secondHandCopper.setId('copper-hand-1');
    testHarness.addToHand(firstHandCopper);
    testHarness.addToHand(secondHandCopper);

    testHarness.pickCards([firstHandCopper, secondHandCopper]);
    await new Poacher(testHarness.sharedGameState).play(testHarness.executor);

    // drew 1, discarded 2
    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.hand.size()).toBe(1);
  });
});
