import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Apothecary } from '../../../src/cards/alchemy/Apothecary';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Potion } from '../../../src/cards/basic_cards/Potion';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { CardHarness, createCardHarness } from '../testHarness';

const stackDeck = (testHarness: CardHarness, topToBottom: Card[]): void => {
  for (const card of [...topToBottom].reverse()) {
    testHarness.addToDeck(card);
  }
};

const deckIdsTopToBottom = (testHarness: CardHarness): string[] =>
  testHarness.deck
    .asCardArray()
    .map((card) => card.getId())
    .reverse();

const cardIds = (cards: Iterable<Card>): string[] => Array.from(cards, (card) => card.getId());

describe('Apothecary', () => {
  it('draws 1 card and gives +1 Action', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck');
    testHarness.addToDeck(estate);

    await new Apothecary(testHarness.sharedGameState).play(testHarness.executor);

    expect(cardIds(testHarness.hand)).toEqual([estate.getId()]);
    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('puts revealed Coppers and Potions into hand and the rest back on the deck', async () => {
    const testHarness = createCardHarness();
    const drawnSilver = new Silver(testHarness.sharedGameState);
    drawnSilver.setId('silver-deck');
    const firstCopper = new Copper(testHarness.sharedGameState);
    firstCopper.setId('copper-deck-0');
    const potion = new Potion(testHarness.sharedGameState);
    potion.setId('potion-deck');
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck');
    const secondCopper = new Copper(testHarness.sharedGameState);
    secondCopper.setId('copper-deck-1');
    const untouchedGold = new Gold(testHarness.sharedGameState);
    untouchedGold.setId('gold-deck');
    stackDeck(testHarness, [drawnSilver, firstCopper, potion, estate, secondCopper, untouchedGold]);

    await new Apothecary(testHarness.sharedGameState).play(testHarness.executor);

    const handIds = testHarness.hand.asCardArray().map((card) => card.getId());
    expect(handIds).toHaveLength(4);
    expect(handIds).toEqual(expect.arrayContaining(['silver-deck', 'copper-deck-0', 'potion-deck', 'copper-deck-1']));
    expect(deckIdsTopToBottom(testHarness)).toEqual(['estate-deck', 'gold-deck']);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('puts the other revealed cards back in the chosen order', async () => {
    const testHarness = createCardHarness();
    const drawnCopper = new Copper(testHarness.sharedGameState);
    drawnCopper.setId('copper-deck');
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck');
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-deck');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck');
    const potion = new Potion(testHarness.sharedGameState);
    potion.setId('potion-deck');
    stackDeck(testHarness, [drawnCopper, estate, duchy, silver, potion]);

    // Each chosen card goes on top of the previous one
    testHarness.pickCard(duchy);
    testHarness.pickCard(silver);
    await new Apothecary(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['copper-deck', 'potion-deck']);
    expect(deckIdsTopToBottom(testHarness)).toEqual(['estate-deck', 'silver-deck', 'duchy-deck']);
  });

  it('reveals only the cards left when the deck has fewer than 4', async () => {
    const testHarness = createCardHarness();
    const drawnEstate = new Estate(testHarness.sharedGameState);
    drawnEstate.setId('estate-deck');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck');
    stackDeck(testHarness, [drawnEstate, copper, silver]);

    await new Apothecary(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['estate-deck', 'copper-deck']);
    expect(deckIdsTopToBottom(testHarness)).toEqual(['silver-deck']);
  });

  it('still gives +1 Action with an empty deck', async () => {
    const testHarness = createCardHarness();

    await new Apothecary(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.stats.actions).toBe(1);
  });
});
