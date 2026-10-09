import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Province } from '../../../src/cards/basic_cards/Province';
import { Coronet } from '../../../src/cards/cornucopia_and_guilds/Coronet';
import { Courser } from '../../../src/cards/cornucopia_and_guilds/Courser';
import { Joust } from '../../../src/cards/cornucopia_and_guilds/Joust';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

// Copper on the deck for Joust to draw and a Province in hand.
const setUpCards = (testHarness: CardHarness) => {
  const copper = new Copper(testHarness.sharedGameState);
  copper.setId('copper-deck-0');
  testHarness.addToDeck(copper);
  const province = new Province(testHarness.sharedGameState);
  province.setId('province-hand-0');
  testHarness.addToHand(province);
  return { copper, province };
};

// Rewards pile (non-Supply) with Coronet on top and Courser below it.
const setUpRewardsPile = (testHarness: CardHarness) => {
  const coronet = new Coronet(testHarness.sharedGameState);
  coronet.setId('coronet-pile-0');
  const courser = new Courser(testHarness.sharedGameState);
  courser.setId('courser-pile-0');
  const rewards: Card[] = [coronet, courser];
  testHarness.pileCards.set('Rewards', rewards);
  for (const reward of rewards) {
    testHarness.sharedCardsById.set(reward.getId(), reward);
  }
  return { coronet, courser };
};

describe('Joust', () => {
  it('gives +1 Card, +1 Action and +$1, and keeps the Province when declined', async () => {
    const testHarness = createCardHarness();
    const { copper, province } = setUpCards(testHarness);
    setUpRewardsPile(testHarness);

    await new Joust(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.hand.asCardArray()).toEqual([province, copper]);
    expect(testHarness.getAddedEffects()).toHaveLength(0);
    expect(testHarness.pileCards.get('Rewards')).toHaveLength(2);
  });

  it('sets aside a Province to gain any Reward to hand, then discards the Province in Clean-up', async () => {
    const testHarness = createCardHarness();
    const { copper, province } = setUpCards(testHarness);
    const { coronet, courser } = setUpRewardsPile(testHarness);

    testHarness.pickCard(province);
    testHarness.pickCard(courser);
    await new Joust(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([copper, courser]);
    expect(province.getLocation()).toBe(CardLocation.SET_ASIDE);
    expect(testHarness.pileCards.get('Rewards')).toEqual([coronet]);
    expect(testHarness.discard.size()).toBe(0);

    const [cleanupEffect] = testHarness.getAddedEffects(EffectTriggerType.CLEANUP_START);
    await cleanupEffect.doAction(testHarness.executor, undefined);

    expect(testHarness.discard.asCardArray()).toEqual([province]);
    expect(cleanupEffect.hasExpired()).toBe(true);
  });

  it('cannot set aside a card other than a Province', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);
    setUpRewardsPile(testHarness);

    testHarness.pickCard(copper);
    await new Joust(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([copper]);
    expect(testHarness.getAddedEffects()).toHaveLength(0);
    expect(testHarness.pileCards.get('Rewards')).toHaveLength(2);
  });
});
