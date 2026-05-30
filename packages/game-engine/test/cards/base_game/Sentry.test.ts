import { describe, expect, it } from 'vitest';

import { Sentry } from '../../../src/cards/base_game/Sentry';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Sentry', () => {
  it('draws 1 card and adds 1 action', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    // default: choose nothing to trash or discard
    await new Sentry(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('trashes chosen top-deck cards', async () => {
    const testHarness = createCardHarness();
    // Deck order (LIFO): last added = top of deck
    // Sentry draws 1 first, then takes 2 off deck to reveal
    const initiallyDrawnCopper = new Copper(testHarness.sharedGameState);
    initiallyDrawnCopper.setId('copper-drawn-first');
    const secondRevealedCopper = new Copper(testHarness.sharedGameState);
    secondRevealedCopper.setId('copper-revealed-second');
    const firstRevealedCopper = new Copper(testHarness.sharedGameState);
    firstRevealedCopper.setId('copper-revealed-first');
    // Added last → drawn first
    testHarness.addToDeck(initiallyDrawnCopper); // position 0 (bottom)
    testHarness.addToDeck(secondRevealedCopper); // position 1
    testHarness.addToDeck(firstRevealedCopper); // position 2 (top) → drawn first by Sentry

    // trash both revealed cards; discard none
    testHarness.pickCards([secondRevealedCopper, initiallyDrawnCopper]);
    testHarness.pickCards([]);
    await new Sentry(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(2);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(1);
  });

  it('discards chosen top-deck cards and topdecks the rest', async () => {
    const testHarness = createCardHarness();
    // Deck order (LIFO): last added = top
    // Sentry draws 1 first (c0 — top), then takes 2 off (c1, c2)
    const firstDrawnCopper = new Copper(testHarness.sharedGameState);
    firstDrawnCopper.setId('copper-drawn-first');
    const discardedRevealedCopper = new Copper(testHarness.sharedGameState);
    discardedRevealedCopper.setId('copper-revealed-discarded');
    const topDeckedRevealedCopper = new Copper(testHarness.sharedGameState);
    topDeckedRevealedCopper.setId('copper-revealed-topdecked');
    testHarness.addToDeck(topDeckedRevealedCopper); // bottom
    testHarness.addToDeck(discardedRevealedCopper); // middle
    testHarness.addToDeck(firstDrawnCopper); // top → drawn into hand

    // After drawing c0, topCards = {c1, c2} (c1 is top, c2 is next)
    testHarness.pickCards([]); // trash: none
    testHarness.pickCards([discardedRevealedCopper]); // discard: one revealed card
    // topDeckCardsFromRevealedSet: c2 remains, pick c2 to topdeck
    testHarness.pickCard(topDeckedRevealedCopper);
    await new Sentry(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1); // one revealed card discarded
    expect(testHarness.deck.size()).toBe(1); // one revealed card put back on deck
    expect(testHarness.sharedTrash.size()).toBe(0);
  });
});
