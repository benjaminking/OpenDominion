import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { SecretPassage } from '../../../src/cards/intrigue/SecretPassage';
import { createCardHarness } from '../testHarness';

describe('SecretPassage', () => {
  it('draws 2 cards and adds 1 action', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }

    // default: no card chosen to insert into deck
    await new SecretPassage(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('inserts chosen hand card into deck at chosen depth', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }
    const handCardToInsert = new Copper(testHarness.sharedGameState);
    handCardToInsert.setId('hand-card-to-insert');
    testHarness.addToHand(handCardToInsert);

    testHarness.pickCard(handCardToInsert); // choose card to put in deck
    testHarness.pickOption('0'); // depth 0 = top of deck
    await new SecretPassage(testHarness.sharedGameState).play(testHarness.executor);

    // Started: 1 in hand, 4 in deck
    // Drew 2: hand = 1 + 2 = 3, deck = 4 - 2 = 2
    // putCardIntoDeck inserts into deck without removing from hand
    // hand = 3, deck = 2 + 1 = 3
    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.deck.size()).toBe(3);
  });
});
