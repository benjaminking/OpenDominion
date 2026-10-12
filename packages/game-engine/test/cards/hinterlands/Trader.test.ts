import { CardLocation } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Trader } from '../../../src/cards/hinterlands/Trader';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const addSilverPile = (testHarness: CardHarness, numSilvers: number): void => {
  for (let i = 0; i < numSilvers; i++) {
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId(`silver-supply-${String(i)}`);
    testHarness.addSupplyPile(silver);
  }
};

const setUpTraderInHandWithGainedGold = (testHarness: CardHarness) => {
  const trader = new Trader(testHarness.sharedGameState);
  trader.setId('trader-hand');
  testHarness.addToHand(trader);
  addSilverPile(testHarness, 1);
  const supplyGold = new Gold(testHarness.sharedGameState);
  supplyGold.setId('gold-supply-0');
  testHarness.addSupplyPile(supplyGold);
  const gainedGold = new Gold(testHarness.sharedGameState);
  gainedGold.setId('gold-gained');
  testHarness.addToDiscard(gainedGold);
  return { trader, gainedGold };
};

describe('Trader', () => {
  it('trashes a card from hand and gains a Silver per $1 it costs', async () => {
    const testHarness = createCardHarness();
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);
    addSilverPile(testHarness, 3);

    testHarness.pickCard(handEstate);
    await new Trader(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.contains(handEstate)).toBe(true);
    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.discard.asCardArray().every((card) => card.getName() === 'Silver')).toBe(true);
    expect(testHarness.pileCards.get('Silver')).toHaveLength(1);
  });

  it('gains no Silver when trashing a $0 card', async () => {
    const testHarness = createCardHarness();
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);
    addSilverPile(testHarness, 3);

    testHarness.pickCard(handCopper);
    await new Trader(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.contains(handCopper)).toBe(true);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('does nothing with an empty hand', async () => {
    const testHarness = createCardHarness();
    addSilverPile(testHarness, 3);

    await new Trader(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('can react to gaining a card only while in hand', () => {
    const testHarness = createCardHarness();
    const { trader, gainedGold } = setUpTraderInHandWithGainedGold(testHarness);
    const [reaction] = testHarness.getCardEffects(trader, EffectTriggerType.GAIN);

    const gainedToDiscard = new EffectContextBuilder()
      .withTargetCard(gainedGold)
      .withGainLocation(CardLocation.DISCARD)
      .build();
    expect(reaction.getCardEligibility().matches(gainedGold)).toBe(true);
    expect(reaction.areOtherConditionsSatisfied(testHarness.executor, gainedToDiscard)).toBe(true);
    trader.setLocation(CardLocation.IN_PLAY);
    expect(reaction.areOtherConditionsSatisfied(testHarness.executor, gainedToDiscard)).toBe(false);
  });

  it('can still react to a gained card that has moved since it was gained, but loses track of it', async () => {
    const testHarness = createCardHarness();
    const { trader, gainedGold } = setUpTraderInHandWithGainedGold(testHarness);
    const [reaction] = testHarness.getCardEffects(trader, EffectTriggerType.GAIN);
    const lostTrack = vi.spyOn(testHarness.executor, 'sendLostTrackMessage');

    const gainedToDiscard = new EffectContextBuilder()
      .withTargetCard(gainedGold)
      .withGainLocation(CardLocation.DISCARD)
      .withLocationExpectation(testHarness.executor.createLocationExpectation(CardLocation.DISCARD))
      .build();

    // e.g. Watchtower put it onto the deck
    testHarness.discard.removeCard(gainedGold);
    testHarness.addToDeck(gainedGold);
    expect(reaction.areOtherConditionsSatisfied(testHarness.executor, gainedToDiscard)).toBe(true);

    await reaction.doAction(testHarness.executor, gainedToDiscard);

    expect(lostTrack).toHaveBeenCalledWith(gainedGold);
    expect(testHarness.deck.contains(gainedGold)).toBe(true);
    expect(testHarness.pileCards.get('Gold')).not.toContain(gainedGold);
    expect(testHarness.pileCards.get('Silver')).toHaveLength(1);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('loses track of a gained card that has left the discard pile and come back', async () => {
    const testHarness = createCardHarness();
    const { trader, gainedGold } = setUpTraderInHandWithGainedGold(testHarness);
    const [reaction] = testHarness.getCardEffects(trader, EffectTriggerType.GAIN);
    const lostTrack = vi.spyOn(testHarness.executor, 'sendLostTrackMessage');

    const gainedToDiscard = new EffectContextBuilder()
      .withTargetCard(gainedGold)
      .withGainLocation(CardLocation.DISCARD)
      .withLocationExpectation(testHarness.executor.createLocationExpectation(CardLocation.DISCARD))
      .build();
    // e.g. it played itself (Trail), then was discarded again
    testHarness.discard.removeCard(gainedGold);
    testHarness.addToInPlay(gainedGold);
    testHarness.inPlay.removeCard(gainedGold);
    testHarness.addToDiscard(gainedGold);

    await reaction.doAction(testHarness.executor, gainedToDiscard);

    expect(lostTrack).toHaveBeenCalledWith(gainedGold);
    expect(testHarness.discard.asCardArray()).toEqual([gainedGold]);
    expect(testHarness.pileCards.get('Silver')).toHaveLength(1);
  });

  it('exchanges a gained card for a Silver when reacting', async () => {
    const testHarness = createCardHarness();
    const { trader, gainedGold } = setUpTraderInHandWithGainedGold(testHarness);
    const [reaction] = testHarness.getCardEffects(trader, EffectTriggerType.GAIN);

    await reaction.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(gainedGold).withGainLocation(CardLocation.DISCARD).build(),
    );

    expect(testHarness.discard.contains(gainedGold)).toBe(false);
    expect(testHarness.discard.size()).toBe(1);
    expect(testHarness.discard.asCardArray()[0].getName()).toBe('Silver');
    expect(testHarness.pileCards.get('Gold')).toContain(gainedGold);
    expect(testHarness.pileCards.get('Silver')).toHaveLength(0);
    expect(testHarness.hand.contains(trader)).toBe(true);
  });

  it('cannot exchange when the Silver pile is empty', async () => {
    const testHarness = createCardHarness();
    const { trader, gainedGold } = setUpTraderInHandWithGainedGold(testHarness);
    testHarness.pileCards.get('Silver')?.splice(0);
    const [reaction] = testHarness.getCardEffects(trader, EffectTriggerType.GAIN);

    await reaction.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(gainedGold).withGainLocation(CardLocation.DISCARD).build(),
    );

    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['gold-gained']);
  });

  it('reveals itself when exchanging a gained card', async () => {
    const testHarness = createCardHarness();
    const { trader, gainedGold } = setUpTraderInHandWithGainedGold(testHarness);
    const [reaction] = testHarness.getCardEffects(trader, EffectTriggerType.GAIN);

    await reaction.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(gainedGold).withGainLocation(CardLocation.DISCARD).build(),
    );

    const revealedTrader = vi
      .mocked(testHarness.sharedGameState.triggerEffect)
      .mock.calls.some(
        ([trigger, , effectContext]) =>
          trigger === EffectTriggerType.REVEAL && effectContext?.getTargetCards()?.contains(trader) === true,
      );
    expect(revealedTrader).toBe(true);
  });
});
