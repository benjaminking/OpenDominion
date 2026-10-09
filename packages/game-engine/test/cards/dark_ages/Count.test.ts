import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Count } from '../../../src/cards/dark_ages/Count';
import { createCardHarness } from '../testHarness';

describe('Count', () => {
  it('discards 2 cards and gives +$3', async () => {
    const testHarness = createCardHarness();
    const handCards: Copper[] = [];
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const handCopper = new Copper(testHarness.sharedGameState);
      handCopper.setId(`copper-hand-${String(cardIndex)}`);
      handCards.push(handCopper);
      testHarness.addToHand(handCopper);
    }

    testHarness.pickOption('Discard 2 cards');
    testHarness.pickCards([handCards[0], handCards[1]]);
    testHarness.pickOption('+$3');
    await new Count(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.asCardArray()).toEqual([handCards[0], handCards[1]]);
    expect(testHarness.hand.asCardArray()).toEqual([handCards[2]]);
    expect(testHarness.stats.coins).toBe(3);
  });

  it('puts a card from hand onto the deck and trashes the rest of the hand', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);

    testHarness.pickOption('Put a card from your hand onto your deck');
    testHarness.pickCard(silver);
    testHarness.pickOption('Trash your hand');
    await new Count(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.deck.getTopCard()).toBe(silver);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.size()).toBe(2);
    expect(testHarness.sharedTrash.contains(estate)).toBe(true);
    expect(testHarness.sharedTrash.contains(copper)).toBe(true);
  });

  it('gains a Duchy', async () => {
    const testHarness = createCardHarness();
    const handCards: Copper[] = [];
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const handCopper = new Copper(testHarness.sharedGameState);
      handCopper.setId(`copper-hand-${String(cardIndex)}`);
      handCards.push(handCopper);
      testHarness.addToHand(handCopper);
    }
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);

    testHarness.pickOption('Discard 2 cards');
    testHarness.pickCards(handCards);
    testHarness.pickOption('Gain a Duchy');
    await new Count(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(3);
    expect(testHarness.discard.contains(duchy)).toBe(true);
    expect(testHarness.pileCards.get('Duchy')).toEqual([]);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('trashes nothing when the hand is already empty', async () => {
    const testHarness = createCardHarness();
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);

    testHarness.pickOption('Put a card from your hand onto your deck');
    testHarness.pickCard(handCopper);
    testHarness.pickOption('Trash your hand');
    await new Count(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.deck.asCardArray()).toEqual([handCopper]);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('gains a Copper to the discard pile', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-supply-0');
    testHarness.addSupplyPile(copper);

    testHarness.pickOption('Gain a Copper');
    testHarness.pickOption('+$3');
    await new Count(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.asCardArray()).toEqual([copper]);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.stats.coins).toBe(3);
  });
});
