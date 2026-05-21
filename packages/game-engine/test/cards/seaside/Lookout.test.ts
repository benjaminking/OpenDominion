import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Lookout } from '../../../src/cards/seaside/Lookout';
import { createCardHarness } from '../testHarness';

describe('Lookout', () => {
  it('reveals 3 top cards, trashing and discarding chosen cards, topdecking the last', async () => {
    const testHarness = createCardHarness();
    const revealedCards: Copper[] = [];
    for (let i = 0; i < 3; i++) {
      const revealedCard = new Copper(testHarness.sharedGameState);
      revealedCard.setId(`revealed-copper-${String(i)}`);
      revealedCards.push(revealedCard);
      testHarness.addToDeck(revealedCard);
    }
    // cards[2] is top of deck, cards[1] next, cards[0] bottom (LIFO)
    testHarness.pickCard(revealedCards[2]); // trash
    testHarness.pickCard(revealedCards[1]); // discard
    testHarness.pickCard(revealedCards[0]); // topdeck (topDeckCardsFromRevealedSet calls chooseCard for each remaining card)
    await new Lookout(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(1);
    expect(testHarness.discard.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(1);
  });
});
