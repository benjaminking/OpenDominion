import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Magnate } from '../../../src/cards/prosperity/Magnate';
import { createCardHarness } from '../testHarness';

describe('Magnate', () => {
  it('draws 1 card per Treasure in hand', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
      const deckEstate = new Estate(testHarness.sharedGameState);
      deckEstate.setId(`estate-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckEstate);
    }

    await new Magnate(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(5);
    expect(testHarness.deck.size()).toBe(3);
  });

  it('draws nothing when there are no Treasures in hand', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    await new Magnate(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(1);
  });
});
