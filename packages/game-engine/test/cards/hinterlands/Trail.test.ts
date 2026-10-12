import { CardLocation } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Trail } from '../../../src/cards/hinterlands/Trail';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { TurnPhase } from '../../../src/turns/TurnPhase';
import { CardHarness, createCardHarness } from '../testHarness';

const addCopperToDeck = (testHarness: CardHarness): void => {
  const deckCopper = new Copper(testHarness.sharedGameState);
  deckCopper.setId('copper-deck-0');
  testHarness.addToDeck(deckCopper);
};

const createTrail = (testHarness: CardHarness): Trail => {
  const trail = new Trail(testHarness.sharedGameState);
  trail.setId('trail-0');
  return trail;
};

const setTurnPhase = (testHarness: CardHarness, turnPhase: TurnPhase): void => {
  testHarness.sharedGameState.getTurnPhase = () => turnPhase;
};

describe('Trail', () => {
  it('draws a card and adds an action', async () => {
    const testHarness = createCardHarness();
    addCopperToDeck(testHarness);

    await createTrail(testHarness).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('may be played when gained', async () => {
    const testHarness = createCardHarness();
    addCopperToDeck(testHarness);
    const trail = createTrail(testHarness);
    testHarness.addToDiscard(trail);
    const [onGain] = testHarness.getCardEffects(trail, EffectTriggerType.GAIN);

    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(trail).withGainLocation(trail.getLocation()).build(),
    );

    expect(testHarness.discard.contains(trail)).toBe(false);
    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('may be played when trashed', async () => {
    const testHarness = createCardHarness();
    addCopperToDeck(testHarness);
    const trail = createTrail(testHarness);
    testHarness.sharedTrash.addCard(trail);
    trail.setLocation(CardLocation.TRASH);
    const [onTrash] = testHarness.getCardEffects(trail, EffectTriggerType.TRASH);

    await onTrash.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(trail).build());

    expect(testHarness.sharedTrash.contains(trail)).toBe(false);
    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('may be played when discarded', async () => {
    const testHarness = createCardHarness();
    addCopperToDeck(testHarness);
    const trail = createTrail(testHarness);
    testHarness.addToDiscard(trail);
    const [onDiscard] = testHarness.getCardEffects(trail, EffectTriggerType.DISCARD);

    await onDiscard.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(trail).build());

    expect(testHarness.discard.contains(trail)).toBe(false);
    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('can react to being gained, trashed or discarded only outside Clean-up', () => {
    const testHarness = createCardHarness();
    const trail = createTrail(testHarness);
    const [onGain] = testHarness.getCardEffects(trail, EffectTriggerType.GAIN);
    const [onTrash] = testHarness.getCardEffects(trail, EffectTriggerType.TRASH);
    const [onDiscard] = testHarness.getCardEffects(trail, EffectTriggerType.DISCARD);
    const canReact = () => [
      onGain.areOtherConditionsSatisfied(
        testHarness.executor,
        new EffectContextBuilder().withTargetCard(trail).withGainLocation(CardLocation.DISCARD).build(),
      ),
      onTrash.areOtherConditionsSatisfied(
        testHarness.executor,
        new EffectContextBuilder().withTargetCard(trail).build(),
      ),
      onDiscard.areOtherConditionsSatisfied(
        testHarness.executor,
        new EffectContextBuilder().withTargetCard(trail).build(),
      ),
    ];

    // Just gained or discarded, in the discard pile. (Being trashed is offered too, as it doesn't check where it is:
    // the location expectation loses track of it once it plays.)
    testHarness.addToDiscard(trail);
    setTurnPhase(testHarness, TurnPhase.ACTION);
    expect(canReact()).toEqual([true, true, true]);
    setTurnPhase(testHarness, TurnPhase.CLEANUP);
    expect(canReact()).toEqual([false, false, false]);

    // Just trashed
    testHarness.discard.removeCard(trail);
    testHarness.sharedTrash.addCard(trail);
    trail.setLocation(CardLocation.TRASH);
    setTurnPhase(testHarness, TurnPhase.ACTION);
    expect(canReact()[1]).toBe(true);
    setTurnPhase(testHarness, TurnPhase.CLEANUP);
    expect(canReact()[1]).toBe(false);
  });

  it('can still react to being gained or discarded once it has moved into the deck, but loses track of itself', async () => {
    const testHarness = createCardHarness();
    addCopperToDeck(testHarness);
    const trail = createTrail(testHarness);
    const [onGain] = testHarness.getCardEffects(trail, EffectTriggerType.GAIN);
    const [onDiscard] = testHarness.getCardEffects(trail, EffectTriggerType.DISCARD);
    setTurnPhase(testHarness, TurnPhase.ACTION);
    const lostTrack = vi.spyOn(testHarness.executor, 'sendLostTrackMessage');

    testHarness.addToDiscard(trail);
    const gainedToDiscard = new EffectContextBuilder()
      .withTargetCard(trail)
      .withGainLocation(CardLocation.DISCARD)
      .withLocationExpectation(testHarness.executor.createLocationExpectation(CardLocation.DISCARD))
      .build();
    const discarded = new EffectContextBuilder()
      .withTargetCard(trail)
      .withLocationExpectation(testHarness.executor.createLocationExpectation(CardLocation.DISCARD))
      .build();
    testHarness.discard.removeCard(trail);
    testHarness.addToDeck(trail);
    expect(onGain.areOtherConditionsSatisfied(testHarness.executor, gainedToDiscard)).toBe(true);
    expect(onDiscard.areOtherConditionsSatisfied(testHarness.executor, discarded)).toBe(true);

    await onGain.doAction(testHarness.executor, gainedToDiscard);
    await onDiscard.doAction(testHarness.executor, discarded);

    expect(lostTrack).toHaveBeenCalledTimes(2);
    expect(lostTrack).toHaveBeenCalledWith(trail);
    expect(testHarness.deck.contains(trail)).toBe(true);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.stats.actions).toBe(0);
  });

  it('is in play after being played when gained', async () => {
    const testHarness = createCardHarness();
    addCopperToDeck(testHarness);
    const trail = createTrail(testHarness);
    testHarness.addToDiscard(trail);
    const [onGain] = testHarness.getCardEffects(trail, EffectTriggerType.GAIN);

    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(trail).withGainLocation(trail.getLocation()).build(),
    );

    expect(testHarness.inPlay.contains(trail)).toBe(true);
  });
});
