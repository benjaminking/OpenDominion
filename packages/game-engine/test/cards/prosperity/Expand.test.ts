import { CardChoice } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Expand } from '../../../src/cards/prosperity/Expand';
import { CardHarness, createCardHarness } from '../testHarness';

const offeredCardNames = (testHarness: CardHarness, callIndex: number): string[] =>
  ((testHarness.decisionService.chooseCard.mock.calls[callIndex] as unknown[])[3] as CardChoice[]).map(
    (choice) => choice.card.name,
  );

describe('Expand', () => {
  it('trashes a card from hand and gains a card costing up to $3 more', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);

    testHarness.pickCard(estate);
    testHarness.pickCard(duchy);
    await new Expand(testHarness.sharedGameState).play(testHarness.executor);

    // Estate costs $2, so up to $5
    expect(offeredCardNames(testHarness, 1).sort()).toEqual(['Duchy', 'Silver']);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.contains(estate)).toBe(true);
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['duchy-supply-0']);
  });

  it('does nothing with an empty hand', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    await new Expand(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
  });
});
