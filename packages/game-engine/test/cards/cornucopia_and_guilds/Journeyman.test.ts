import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Journeyman } from '../../../src/cards/cornucopia_and_guilds/Journeyman';
import { CardHarness, createCardHarness } from '../testHarness';

const nameCopper = (testHarness: CardHarness): void => {
  const supplyCopper = new Copper(testHarness.sharedGameState);
  supplyCopper.setId('copper-supply-0');
  testHarness.addSupplyPile(supplyCopper);
  testHarness.pickCard(supplyCopper);
};

describe('Journeyman', () => {
  it('reveals until 3 cards without the named card, puts those into hand and discards the rest', async () => {
    const testHarness = createCardHarness();
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-deck-0');
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-deck-0');
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-0');
    const copperB = new Copper(testHarness.sharedGameState);
    copperB.setId('copper-deck-1');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    const copperA = new Copper(testHarness.sharedGameState);
    copperA.setId('copper-deck-0');
    // Deck from the top: Copper, Silver, Copper, Estate, Gold, Duchy
    testHarness.addToDeck(duchy);
    testHarness.addToDeck(gold);
    testHarness.addToDeck(estate);
    testHarness.addToDeck(copperB);
    testHarness.addToDeck(silver);
    testHarness.addToDeck(copperA);

    nameCopper(testHarness);
    await new Journeyman(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([silver, estate, gold]);
    expect(testHarness.discard.asCardArray()).toEqual([copperA, copperB]);
    expect(testHarness.deck.asCardArray()).toEqual([duchy]);
  });

  it('stops revealing when the deck runs out', async () => {
    const testHarness = createCardHarness();
    const copperB = new Copper(testHarness.sharedGameState);
    copperB.setId('copper-deck-1');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    const copperA = new Copper(testHarness.sharedGameState);
    copperA.setId('copper-deck-0');
    testHarness.addToDeck(copperB);
    testHarness.addToDeck(silver);
    testHarness.addToDeck(copperA);

    nameCopper(testHarness);
    await new Journeyman(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([silver]);
    expect(testHarness.discard.asCardArray()).toEqual([copperA, copperB]);
    expect(testHarness.deck.size()).toBe(0);
  });
});
