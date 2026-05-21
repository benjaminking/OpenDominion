import { describe, expect, it } from 'vitest';

import { Vassal } from '../../../src/cards/base_game/Vassal';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Vassal', () => {
  it('adds 2 coins when played', async () => {
    const testHarness = createCardHarness();
    // empty deck - card discarded will be undefined
    await new Vassal(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.coins).toBe(2);
  });

  it('discards the top card of deck', async () => {
    const testHarness = createCardHarness();
    const topDeckCopper = new Copper(testHarness.sharedGameState);
    topDeckCopper.setId('copper-deck-top-0');
    testHarness.addToDeck(topDeckCopper);

    // Copper is not an action card so no option presented
    await new Vassal(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(0);
  });
});
