import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Altar } from '../../../src/cards/dark_ages/Altar';
import { createCardHarness } from '../testHarness';

describe('Altar', () => {
  it('trashes a card from hand and gains a card costing up to $5', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);

    testHarness.pickCard(copper);
    testHarness.pickCard(duchy);
    await new Altar(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([copper]);
    expect(testHarness.discard.asCardArray()).toEqual([duchy]);
    expect(testHarness.pileCards.get('Duchy')).toEqual([]);
  });

  it('still gains a card when the hand is empty', async () => {
    const testHarness = createCardHarness();
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);

    testHarness.pickCard(duchy);
    await new Altar(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.discard.asCardArray()).toEqual([duchy]);
  });

  it('cannot gain a card costing more than $5', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);

    testHarness.pickCard(copper);
    await new Altar(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.asCardArray()).toEqual([copper]);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Gold')).toEqual([gold]);
  });
});
