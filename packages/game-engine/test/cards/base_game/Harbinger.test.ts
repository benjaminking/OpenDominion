import { describe, expect, it } from 'vitest';

import { Harbinger } from '../../../src/cards/base_game/Harbinger';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Harbinger', () => {
  it('draws 1 card and adds 1 action', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    await new Harbinger(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('topdecks the chosen discard card', async () => {
    const testHarness = createCardHarness();
    const initialDeckCopper = new Copper(testHarness.sharedGameState);
    initialDeckCopper.setId('copper-deck-initial-0');
    testHarness.addToDeck(initialDeckCopper);
    const discardPileCopper = new Copper(testHarness.sharedGameState);
    discardPileCopper.setId('copper-discard-0');
    testHarness.addToDiscard(discardPileCopper);

    testHarness.pickCard(discardPileCopper);
    await new Harbinger(testHarness.sharedGameState).play(testHarness.executor);

    // Discard card moved to top of deck; previous deck card is still there
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.deck.size()).toBe(1); // initialDeckCopper was drawn
    expect(testHarness.deck.getTopCard()!.getId()).toBe('copper-discard-0');
  });
});
