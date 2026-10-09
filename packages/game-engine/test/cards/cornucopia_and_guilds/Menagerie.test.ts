import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Menagerie } from '../../../src/cards/cornucopia_and_guilds/Menagerie';
import { CardHarness, createCardHarness } from '../testHarness';

const addDeckCards = (testHarness: CardHarness): void => {
  for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
    const deckGold = new Gold(testHarness.sharedGameState);
    deckGold.setId(`gold-deck-${String(cardIndex)}`);
    testHarness.addToDeck(deckGold);
  }
};

describe('Menagerie', () => {
  it('gives +1 Action and +3 Cards when the hand cards all have different names', async () => {
    const testHarness = createCardHarness();
    addDeckCards(testHarness);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    await new Menagerie(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.size()).toBe(6);
  });

  it('gives +1 Card when the hand has duplicates', async () => {
    const testHarness = createCardHarness();
    addDeckCards(testHarness);
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const handCopper = new Copper(testHarness.sharedGameState);
      handCopper.setId(`copper-hand-${String(cardIndex)}`);
      testHarness.addToHand(handCopper);
    }
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    await new Menagerie(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.size()).toBe(4);
  });

  it('gives +3 Cards with an empty hand', async () => {
    const testHarness = createCardHarness();
    addDeckCards(testHarness);

    await new Menagerie(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
  });
});
