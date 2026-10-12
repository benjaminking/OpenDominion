import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Militia } from '../../../src/cards/base_game/Militia';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { GuardDog } from '../../../src/cards/hinterlands/GuardDog';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectSource } from '../../../src/effects/EffectSource';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const addCoppers = (testHarness: CardHarness, location: 'hand' | 'deck', numCoppers: number): void => {
  for (let i = 0; i < numCoppers; i++) {
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId(`copper-${location}-${String(i)}`);
    if (location === 'hand') {
      testHarness.addToHand(copper);
    } else {
      testHarness.addToDeck(copper);
    }
  }
};

const setUpGuardDogInHand = (testHarness: CardHarness) => {
  const guardDog = new GuardDog(testHarness.sharedGameState);
  guardDog.setId('guard-dog-hand');
  testHarness.addToHand(guardDog);
  const militia = new Militia(testHarness.sharedGameState);
  militia.setId('militia-opponent');
  return { guardDog, militia };
};

describe('GuardDog', () => {
  it('draws 2 more cards when you have 5 or fewer cards in hand after the first 2', async () => {
    const testHarness = createCardHarness();
    addCoppers(testHarness, 'hand', 3);
    addCoppers(testHarness, 'deck', 6);

    await new GuardDog(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(7);
    expect(testHarness.deck.size()).toBe(2);
  });

  it('draws only 2 cards when you have more than 5 cards in hand after drawing', async () => {
    const testHarness = createCardHarness();
    addCoppers(testHarness, 'hand', 4);
    addCoppers(testHarness, 'deck', 6);

    await new GuardDog(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(6);
    expect(testHarness.deck.size()).toBe(4);
  });

  it('can react to another player playing an Attack while it is in hand', () => {
    const testHarness = createCardHarness();
    const { guardDog, militia } = setUpGuardDogInHand(testHarness);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-opponent');

    const [reaction] = guardDog.getEffects();

    expect(reaction.getSource()).toBe(EffectSource.OTHER_PLAYER);
    expect(reaction.getCardEligibility().matches(militia)).toBe(true);
    expect(reaction.getCardEligibility().matches(village)).toBe(false);
    expect(reaction.areOtherConditionsSatisfied(testHarness.executor)).toBe(true);
    guardDog.setLocation(CardLocation.DISCARD);
    expect(reaction.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
  });

  it('plays itself from hand when reacting', async () => {
    const testHarness = createCardHarness();
    const { guardDog, militia } = setUpGuardDogInHand(testHarness);
    addCoppers(testHarness, 'deck', 5);
    const [reaction] = guardDog.getEffects();

    await reaction.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(militia).build());

    expect(testHarness.hand.contains(guardDog)).toBe(false);
    expect(testHarness.hand.size()).toBe(4);
    expect(testHarness.deck.size()).toBe(1);
  });

  it('reacts when the Attack is played, before it resolves', () => {
    const testHarness = createCardHarness();
    const { guardDog } = setUpGuardDogInHand(testHarness);

    expect(testHarness.getCardEffects(guardDog, EffectTriggerType.ATTACK)).toHaveLength(1);
  });

  it('is in play after playing itself as a reaction', async () => {
    const testHarness = createCardHarness();
    const { guardDog, militia } = setUpGuardDogInHand(testHarness);
    addCoppers(testHarness, 'deck', 5);
    const [reaction] = guardDog.getEffects();

    await reaction.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(militia).build());

    expect(testHarness.inPlay.contains(guardDog)).toBe(true);
  });
});
