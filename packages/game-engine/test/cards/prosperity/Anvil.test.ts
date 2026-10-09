import { CardChoice } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Anvil } from '../../../src/cards/prosperity/Anvil';
import { CardHarness, createCardHarness } from '../testHarness';

const offeredCardNames = (testHarness: CardHarness, callIndex: number): string[] =>
  ((testHarness.decisionService.chooseCard.mock.calls[callIndex] as unknown[])[3] as CardChoice[]).map(
    (choice) => choice.card.name,
  );

describe('Anvil', () => {
  it('adds $1 and gains nothing when no Treasure is discarded', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    // default: choice returns none
    await new Anvil(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.hand.contains(copper)).toBe(true);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Silver')).toHaveLength(1);
  });

  it('discards a Treasure to gain a card costing up to $4', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);

    testHarness.pickCard(copper);
    testHarness.pickCard(silver);
    await new Anvil(testHarness.sharedGameState).play(testHarness.executor);

    expect(offeredCardNames(testHarness, 0)).toEqual(['Copper']);
    expect(offeredCardNames(testHarness, 1)).toEqual(['Silver']);
    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['estate-hand-0']);
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['copper-hand-0', 'silver-supply-0']);
  });

  it('does not prompt when there is no Treasure in hand', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    await new Anvil(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.hand.size()).toBe(1);
  });
});
