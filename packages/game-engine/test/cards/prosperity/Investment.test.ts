import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Investment } from '../../../src/cards/prosperity/Investment';
import { createCardHarness } from '../testHarness';

describe('Investment', () => {
  it('trashes a card from hand and can add $1', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    const investment = new Investment(testHarness.sharedGameState);
    investment.setId('investment-hand-0');
    testHarness.addToHand(investment);

    testHarness.pickCard(estate);
    testHarness.pickOption('+$1');
    await testHarness.executor.playCardFromHand(investment);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.stats.vp).toBe(0);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.asCardArray().map((card) => card.getId())).toEqual(['estate-hand-0']);
    expect(testHarness.inPlay.contains(investment)).toBe(true);
  });

  it('can trash itself for +1 VP per differently named Treasure in hand', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const handCopper = new Copper(testHarness.sharedGameState);
      handCopper.setId(`copper-hand-${String(cardIndex)}`);
      testHarness.addToHand(handCopper);
    }
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-hand-0');
    testHarness.addToHand(gold);
    const investment = new Investment(testHarness.sharedGameState);
    investment.setId('investment-hand-0');
    testHarness.addToHand(investment);

    testHarness.pickCard(estate);
    testHarness.pickOption('Trash this for VP');
    await testHarness.executor.playCardFromHand(investment);

    // Copper, Silver and Gold
    expect(testHarness.stats.vp).toBe(3);
    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.inPlay.contains(investment)).toBe(false);
    expect(testHarness.sharedTrash.asCardArray().map((card) => card.getId())).toEqual([
      'estate-hand-0',
      'investment-hand-0',
    ]);
    expect(testHarness.hand.size()).toBe(4);
  });

  it('still lets you choose +$1 with an empty hand', async () => {
    const testHarness = createCardHarness();

    testHarness.pickOption('+$1');
    await new Investment(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('gives no VP when it cannot trash itself', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const handEstate = new Estate(testHarness.sharedGameState);
      handEstate.setId(`estate-hand-${String(cardIndex)}`);
      testHarness.addToHand(handEstate);
    }
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);
    const investment = new Investment(testHarness.sharedGameState);
    investment.setId('investment-hand-0');
    testHarness.addToHand(investment);
    const [firstEstate, secondEstate] = testHarness.hand.asCardArray();

    // Played twice (as with Tiara), choosing to trash it both times
    testHarness.pickCard(firstEstate);
    testHarness.pickOption('Trash this for VP');
    testHarness.pickCard(secondEstate);
    testHarness.pickOption('Trash this for VP');
    await testHarness.executor.playCardFromHandNTimes(investment, 2);

    expect(testHarness.sharedTrash.contains(investment)).toBe(true);
    expect(testHarness.stats.vp).toBe(2);
  });
});
