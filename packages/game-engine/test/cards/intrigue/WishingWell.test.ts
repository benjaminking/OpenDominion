import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { WishingWell } from '../../../src/cards/intrigue/WishingWell';
import { createCardHarness } from '../testHarness';

describe('WishingWell', () => {
  it('draws 1 card and adds 1 action', async () => {
    const testHarness = createCardHarness();
    const drawCard = new Copper(testHarness.sharedGameState);
    drawCard.setId('draw-copper');
    testHarness.addToDeck(drawCard);

    await new WishingWell(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('puts the revealed top card into hand when it was named', async () => {
    const testHarness = createCardHarness();
    // topCard added first → lower in deck
    const topDeckCard = new Copper(testHarness.sharedGameState);
    topDeckCard.setId('top-deck-copper');
    testHarness.addToDeck(topDeckCard);
    // draw added second → top of deck, drawn first by drawCards(1)
    const firstDrawCard = new Copper(testHarness.sharedGameState);
    firstDrawCard.setId('first-draw-copper');
    testHarness.addToDeck(firstDrawCard);
    // The named card is the Supply's Copper, a different card from the one on the deck
    const supplyCopper = new Copper(testHarness.sharedGameState);
    supplyCopper.setId('supply-copper');
    testHarness.addSupplyPile(supplyCopper);

    testHarness.pickCard(supplyCopper);
    await new WishingWell(testHarness.sharedGameState).play(testHarness.executor);

    // Drew 1 (draw) + topCard drawn via match = 2
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.hand.contains(topDeckCard)).toBe(true);
  });

  it('leaves the revealed top card on the deck when a different card was named', async () => {
    const testHarness = createCardHarness();
    const topDeckCard = new Copper(testHarness.sharedGameState);
    topDeckCard.setId('top-deck-copper');
    testHarness.addToDeck(topDeckCard);
    const firstDrawCard = new Copper(testHarness.sharedGameState);
    firstDrawCard.setId('first-draw-copper');
    testHarness.addToDeck(firstDrawCard);
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('supply-silver');
    testHarness.addSupplyPile(supplySilver);

    testHarness.pickCard(supplySilver);
    await new WishingWell(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.contains(topDeckCard)).toBe(true);
  });
});
