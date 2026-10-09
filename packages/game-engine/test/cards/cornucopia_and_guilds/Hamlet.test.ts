import { ChoiceType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Hamlet } from '../../../src/cards/cornucopia_and_guilds/Hamlet';
import { CardHarness, createCardHarness } from '../testHarness';

const setUpCards = (testHarness: CardHarness) => {
  const copper = new Copper(testHarness.sharedGameState);
  copper.setId('copper-deck-0');
  testHarness.addToDeck(copper);
  const estate = new Estate(testHarness.sharedGameState);
  estate.setId('estate-hand-0');
  testHarness.addToHand(estate);
  const silver = new Silver(testHarness.sharedGameState);
  silver.setId('silver-hand-0');
  testHarness.addToHand(silver);
  return { copper, estate, silver };
};

describe('Hamlet', () => {
  it('gives only +1 Card and +1 Action when both discards are declined', async () => {
    const testHarness = createCardHarness();
    const { copper } = setUpCards(testHarness);

    await new Hamlet(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.hand.contains(copper)).toBe(true);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.buys).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('discards a card for +1 Action and another for +1 Buy', async () => {
    const testHarness = createCardHarness();
    const { copper, estate, silver } = setUpCards(testHarness);

    testHarness.pickCard(estate);
    testHarness.pickCard(silver);
    await new Hamlet(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([copper]);
    expect(testHarness.discard.asCardArray()).toEqual([estate, silver]);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.buys).toBe(1);
  });

  it('can discard only for +1 Buy', async () => {
    const testHarness = createCardHarness();
    const { estate } = setUpCards(testHarness);

    testHarness.decisionService.chooseCard.mockResolvedValueOnce({ type: ChoiceType.None });
    testHarness.pickCard(estate);
    await new Hamlet(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.asCardArray()).toEqual([estate]);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.buys).toBe(1);
  });
});
