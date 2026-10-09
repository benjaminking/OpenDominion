import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Catacombs } from '../../../src/cards/dark_ages/Catacombs';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Catacombs', () => {
  it('puts the top 3 cards of the deck into hand', async () => {
    const testHarness = createCardHarness();
    const deckCards = [];
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      deckCards.push(deckCopper);
      testHarness.addToDeck(deckCopper);
    }

    testHarness.pickOption('Put them into your hand');
    await new Catacombs(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.hand.contains(deckCards[0])).toBe(false);
    expect(testHarness.deck.asCardArray()).toEqual([deckCards[0]]);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('discards the top 3 cards and draws 3 more', async () => {
    const testHarness = createCardHarness();
    const lowerCards = [];
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const deckEstate = new Estate(testHarness.sharedGameState);
      deckEstate.setId(`estate-deck-${String(cardIndex)}`);
      lowerCards.push(deckEstate);
      testHarness.addToDeck(deckEstate);
    }
    const topCards = [];
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      topCards.push(deckCopper);
      testHarness.addToDeck(deckCopper);
    }

    testHarness.pickOption('Discard them and +3 Cards');
    await new Catacombs(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(3);
    expect(topCards.every((card) => testHarness.discard.contains(card))).toBe(true);
    expect(testHarness.hand.size()).toBe(3);
    expect(lowerCards.every((card) => testHarness.hand.contains(card))).toBe(true);
    expect(testHarness.deck.size()).toBe(0);
  });

  it('only looks at the cards available when the deck has fewer than 3', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    testHarness.pickOption('Put them into your hand');
    await new Catacombs(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(0);
  });

  it('when trashed, gains a cheaper card', async () => {
    const testHarness = createCardHarness();
    const catacombs = new Catacombs(testHarness.sharedGameState);
    catacombs.setId('catacombs-0');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    const [onTrash] = testHarness.getCardEffects(catacombs, EffectTriggerType.TRASH);
    testHarness.pickCard(silver);
    await onTrash.doAction(testHarness.executor, catacombs);

    expect(testHarness.discard.asCardArray()).toEqual([silver]);
  });

  it('when trashed, cannot gain a card costing the same or more', async () => {
    const testHarness = createCardHarness();
    const catacombs = new Catacombs(testHarness.sharedGameState);
    catacombs.setId('catacombs-0');
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);

    const [onTrash] = testHarness.getCardEffects(catacombs, EffectTriggerType.TRASH);
    testHarness.pickCard(duchy);
    await onTrash.doAction(testHarness.executor, catacombs);

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Duchy')).toEqual([duchy]);
  });
});
