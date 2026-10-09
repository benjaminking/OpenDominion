import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Trail } from '../../../src/cards/hinterlands/Trail';
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

    await onGain.doAction(testHarness.executor, trail);

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

    await onTrash.doAction(testHarness.executor, trail);

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

    await onDiscard.doAction(testHarness.executor, trail);

    expect(testHarness.discard.contains(trail)).toBe(false);
    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('can react to being gained, trashed or discarded only outside Clean-up', () => {
    const testHarness = createCardHarness();
    const trail = createTrail(testHarness);
    const reactions = [EffectTriggerType.GAIN, EffectTriggerType.TRASH, EffectTriggerType.DISCARD].flatMap((trigger) =>
      testHarness.getCardEffects(trail, trigger),
    );
    expect(reactions).toHaveLength(3);

    setTurnPhase(testHarness, TurnPhase.ACTION);
    expect(reactions.map((reaction) => reaction.areOtherConditionsSatisfied(testHarness.executor))).toEqual([
      true,
      true,
      true,
    ]);

    setTurnPhase(testHarness, TurnPhase.CLEANUP);
    expect(reactions.map((reaction) => reaction.areOtherConditionsSatisfied(testHarness.executor))).toEqual([
      false,
      false,
      false,
    ]);
  });

  // BUG: ie.playCardFromLocation removes the card from its location but never puts it into play
  it('is in play after being played when gained', async () => {
    const testHarness = createCardHarness();
    addCopperToDeck(testHarness);
    const trail = createTrail(testHarness);
    testHarness.addToDiscard(trail);
    const [onGain] = testHarness.getCardEffects(trail, EffectTriggerType.GAIN);

    await onGain.doAction(testHarness.executor, trail);

    expect(testHarness.inPlay.contains(trail)).toBe(true);
  });
});
