import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Carnival } from '../../../src/cards/cornucopia_and_guilds/Carnival';
import { createCardHarness } from '../testHarness';

describe('Carnival', () => {
  it('puts one of each differently named revealed card into hand and discards the rest', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-deck-0');
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-0');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    const copperA = new Copper(testHarness.sharedGameState);
    copperA.setId('copper-deck-0');
    const copperB = new Copper(testHarness.sharedGameState);
    copperB.setId('copper-deck-1');
    // Top 4: Copper, Copper, Silver, Estate; Gold stays in the deck
    testHarness.addToDeck(gold);
    testHarness.addToDeck(estate);
    testHarness.addToDeck(silver);
    testHarness.addToDeck(copperB);
    testHarness.addToDeck(copperA);

    await new Carnival(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray().map((card) => card.getName())).toEqual(['Copper', 'Silver', 'Estate']);
    expect(testHarness.discard.asCardArray().map((card) => card.getName())).toEqual(['Copper']);
    expect(testHarness.deck.asCardArray()).toEqual([gold]);
  });

  it('puts all 4 cards into hand when they all have different names', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-deck-0');
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-0');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(gold);
    testHarness.addToDeck(estate);
    testHarness.addToDeck(silver);
    testHarness.addToDeck(copper);

    await new Carnival(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(4);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.deck.size()).toBe(0);
  });

  it('reveals only the remaining cards when the deck has fewer than 4', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(silver);
    testHarness.addToDeck(copper);

    await new Carnival(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.discard.size()).toBe(0);
  });
});
