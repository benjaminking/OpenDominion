import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Clerk } from '../../../src/cards/prosperity/Clerk';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const fillTargetHand = (targetHarness: CardHarness, numCoppers: number): Estate => {
  for (let cardIndex = 0; cardIndex < numCoppers; cardIndex++) {
    const targetCopper = new Copper(targetHarness.sharedGameState);
    targetCopper.setId(`copper-target-hand-${String(cardIndex)}`);
    targetHarness.addToHand(targetCopper);
  }
  const targetEstate = new Estate(targetHarness.sharedGameState);
  targetEstate.setId('estate-target-hand-0');
  targetHarness.addToHand(targetEstate);
  return targetEstate;
};

describe('Clerk', () => {
  it('adds $2 and each other player with 5 or more cards in hand puts one onto their deck', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    testHarness.routeOtherPlayersTo(targetHarness);
    const targetEstate = fillTargetHand(targetHarness, 4);

    targetHarness.pickCard(targetEstate);
    await new Clerk(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(targetHarness.hand.size()).toBe(4);
    expect(targetHarness.hand.contains(targetEstate)).toBe(false);
    expect(targetHarness.deck.getTopCard()?.getId()).toBe('estate-target-hand-0');
  });

  it('does not affect other players with fewer than 5 cards in hand', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    testHarness.routeOtherPlayersTo(targetHarness);
    fillTargetHand(targetHarness, 3);

    await new Clerk(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(targetHarness.hand.size()).toBe(4);
    expect(targetHarness.deck.size()).toBe(0);
    expect(targetHarness.decisionService.chooseCard).not.toHaveBeenCalled();
  });

  it('is an Attack, so its effect on other players goes through the attack', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    const targetEstate = fillTargetHand(targetHarness, 4);
    const clerk = new Clerk(testHarness.sharedGameState);
    clerk.setId('clerk-0');

    targetHarness.pickCard(targetEstate);
    await clerk.play(testHarness.executor);

    expect(clerk.hasType(CardType.ATTACK)).toBe(true);
    expect(targetHarness.deck.getTopCard()?.getId()).toBe('estate-target-hand-0');
  });

  it('may be played from hand at the start of your turn', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    testHarness.routeOtherPlayersTo(targetHarness);
    const clerk = new Clerk(testHarness.sharedGameState);
    clerk.setId('clerk-hand-0');
    testHarness.addToHand(clerk);

    const turnStartEffects = testHarness.getCardEffects(clerk, EffectTriggerType.TURN_START);
    expect(turnStartEffects).toHaveLength(1);
    expect(turnStartEffects[0].isMandatory()).toBe(false);
    expect(turnStartEffects[0].areOtherConditionsSatisfied(testHarness.executor)).toBe(true);
    await turnStartEffects[0].doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.hand.contains(clerk)).toBe(false);
  });

  it('is in play after being played from hand at the start of your turn', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    testHarness.routeOtherPlayersTo(targetHarness);
    const clerk = new Clerk(testHarness.sharedGameState);
    clerk.setId('clerk-hand-0');
    testHarness.addToHand(clerk);

    await testHarness
      .getCardEffects(clerk, EffectTriggerType.TURN_START)[0]
      .doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.inPlay.contains(clerk)).toBe(true);
  });

  it('can only be played at the start of your turn while it is in your hand', () => {
    const testHarness = createCardHarness();
    const clerk = new Clerk(testHarness.sharedGameState);
    clerk.setId('clerk-in-play-0');
    testHarness.addToInPlay(clerk);

    const turnStartEffect = testHarness.getCardEffects(clerk, EffectTriggerType.TURN_START)[0];

    expect(turnStartEffect.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
  });
});
