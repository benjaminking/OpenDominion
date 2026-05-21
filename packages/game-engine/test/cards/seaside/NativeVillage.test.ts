import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { NativeVillage } from '../../../src/cards/seaside/NativeVillage';
import { createCardHarness } from '../testHarness';

describe('NativeVillage', () => {
  it('puts the top card of the deck on the native village mat when that option is chosen', async () => {
    const testHarness = createCardHarness();
    const topDeckCard = new Copper(testHarness.sharedGameState);
    topDeckCard.setId('top-deck-copper');
    testHarness.addToDeck(topDeckCard);

    testHarness.pickOption('Put the top card of your deck face down on your Native Village mat');
    await new NativeVillage(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.deck.size()).toBe(0);
  });

  it('puts native village mat cards into hand when that option is chosen', async () => {
    const testHarness = createCardHarness();
    const topDeckCard = new Copper(testHarness.sharedGameState);
    topDeckCard.setId('top-deck-copper');
    testHarness.addToDeck(topDeckCard);
    // First, put card on mat
    testHarness.pickOption('Put the top card of your deck face down on your Native Village mat');
    await new NativeVillage(testHarness.sharedGameState).play(testHarness.executor);

    // Now retrieve
    testHarness.pickOption('Put all the cards from your Native Village mat into your hand');
    await new NativeVillage(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
  });
});
