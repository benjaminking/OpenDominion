import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Masquerade } from '../../../src/cards/intrigue/Masquerade';
import { createCardHarness } from '../testHarness';

describe('Masquerade', () => {
  it('draws 2 cards', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }

    // default: no card chosen to trash
    await new Masquerade(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
  });

  it('trashes chosen card from hand', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }
    const cardToTrash = new Copper(testHarness.sharedGameState);
    cardToTrash.setId('card-to-trash');
    testHarness.addToHand(cardToTrash);

    testHarness.pickCard(cardToTrash);
    await new Masquerade(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(1);
    expect(testHarness.hand.size()).toBe(2); // drew 2, trashed 1 from initial hand
  });
});
