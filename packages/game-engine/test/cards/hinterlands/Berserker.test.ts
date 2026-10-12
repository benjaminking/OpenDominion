import { CardLocation } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Berserker } from '../../../src/cards/hinterlands/Berserker';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const setUpGainedBerserkerWithActionInPlay = (testHarness: CardHarness) => {
  const village = new Village(testHarness.sharedGameState);
  village.setId('village-in-play');
  testHarness.addToInPlay(village);
  const silver = new Silver(testHarness.sharedGameState);
  silver.setId('silver-supply-0');
  testHarness.addSupplyPile(silver);
  const berserker = new Berserker(testHarness.sharedGameState);
  berserker.setId('berserker-gained');
  testHarness.addToDiscard(berserker);
  return { berserker, silver };
};

describe('Berserker', () => {
  it('gains a card costing less than itself', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);
    const berserker = new Berserker(testHarness.sharedGameState);
    berserker.setId('berserker-played');

    testHarness.pickCard(silver);
    await berserker.play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1);
    expect(testHarness.discard.contains(silver)).toBe(true);
    expect(testHarness.pileCards.get('Silver')).toHaveLength(0);
  });

  it('cannot gain a card costing as much as or more than itself', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);
    const supplyBerserker = new Berserker(testHarness.sharedGameState);
    supplyBerserker.setId('berserker-supply-0');
    testHarness.addSupplyPile(supplyBerserker);
    const berserker = new Berserker(testHarness.sharedGameState);
    berserker.setId('berserker-played');

    testHarness.pickCard(gold);
    await berserker.play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
  });

  it('makes each other player discard down to 3 cards', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    const targetHandCards: Copper[] = [];
    for (let i = 0; i < 5; i++) {
      const targetCopper = new Copper(targetHarness.sharedGameState);
      targetCopper.setId(`copper-target-hand-${String(i)}`);
      targetHandCards.push(targetCopper);
      targetHarness.addToHand(targetCopper);
    }
    const berserker = new Berserker(testHarness.sharedGameState);
    berserker.setId('berserker-played');

    targetHarness.pickCards([targetHandCards[0], targetHandCards[1]]);
    await berserker.play(testHarness.executor);

    expect(targetHarness.hand.size()).toBe(3);
    expect(targetHarness.discard.size()).toBe(2);
    expect(targetHarness.discard.contains(targetHandCards[0])).toBe(true);
    expect(targetHarness.discard.contains(targetHandCards[1])).toBe(true);
  });

  it('plays itself when gained while you have an Action in play', async () => {
    const testHarness = createCardHarness();
    const { berserker, silver } = setUpGainedBerserkerWithActionInPlay(testHarness);
    const [onGain] = testHarness.getCardEffects(berserker, EffectTriggerType.GAIN);

    expect(
      onGain.areOtherConditionsSatisfied(
        testHarness.executor,
        new EffectContextBuilder().withTargetCard(berserker).withGainLocation(CardLocation.DISCARD).build(),
      ),
    ).toBe(true);
    testHarness.pickCard(silver);
    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(berserker).withGainLocation(berserker.getLocation()).build(),
    );

    expect(testHarness.discard.contains(berserker)).toBe(false);
    expect(testHarness.discard.contains(silver)).toBe(true);
  });

  it('does not play itself when gained without an Action in play', () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-in-play');
    testHarness.addToInPlay(copper);
    const berserker = new Berserker(testHarness.sharedGameState);
    berserker.setId('berserker-gained');
    testHarness.addToDiscard(berserker);

    const [onGain] = testHarness.getCardEffects(berserker, EffectTriggerType.GAIN);

    expect(
      onGain.areOtherConditionsSatisfied(
        testHarness.executor,
        new EffectContextBuilder().withTargetCard(berserker).withGainLocation(CardLocation.DISCARD).build(),
      ),
    ).toBe(false);
  });

  it('loses track of itself, without playing, once it has moved since it was gained', async () => {
    const testHarness = createCardHarness();
    const { berserker } = setUpGainedBerserkerWithActionInPlay(testHarness);
    const [onGain] = testHarness.getCardEffects(berserker, EffectTriggerType.GAIN);
    const lostTrack = vi.spyOn(testHarness.executor, 'sendLostTrackMessage');

    const gainedToDiscard = new EffectContextBuilder()
      .withTargetCard(berserker)
      .withGainLocation(CardLocation.DISCARD)
      .withLocationExpectation(testHarness.executor.createLocationExpectation(CardLocation.DISCARD))
      .build();
    // e.g. Trader returned it to its pile
    berserker.setLocation(CardLocation.PILE);
    expect(onGain.areOtherConditionsSatisfied(testHarness.executor, gainedToDiscard)).toBe(true);

    await onGain.doAction(testHarness.executor, gainedToDiscard);

    expect(lostTrack).toHaveBeenCalledWith(berserker);
    expect(berserker.getLocation()).toBe(CardLocation.PILE);
    expect(testHarness.inPlay.contains(berserker)).toBe(false);
  });

  it('is in play after playing itself on gain', async () => {
    const testHarness = createCardHarness();
    const { berserker, silver } = setUpGainedBerserkerWithActionInPlay(testHarness);
    const [onGain] = testHarness.getCardEffects(berserker, EffectTriggerType.GAIN);

    testHarness.pickCard(silver);
    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(berserker).withGainLocation(berserker.getLocation()).build(),
    );

    expect(testHarness.inPlay.contains(berserker)).toBe(true);
  });
});
