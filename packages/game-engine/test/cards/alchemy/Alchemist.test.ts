import { describe, expect, it } from 'vitest';

import { Alchemist } from '../../../src/cards/alchemy/Alchemist';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Potion } from '../../../src/cards/basic_cards/Potion';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Alchemist', () => {
  it('draws 2 cards and gives +1 Action', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 3; i++) {
      const copper = new Copper(testHarness.sharedGameState);
      copper.setId(`copper-deck-${String(i)}`);
      testHarness.addToDeck(copper);
    }

    await new Alchemist(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('may put itself onto the deck at the start of Clean-up when a Potion is in play', async () => {
    const testHarness = createCardHarness();
    const alchemist = new Alchemist(testHarness.sharedGameState);
    alchemist.setId('alchemist-in-play');
    testHarness.addToInPlay(alchemist);
    const potion = new Potion(testHarness.sharedGameState);
    potion.setId('potion-in-play');
    testHarness.addToInPlay(potion);

    await alchemist.play(testHarness.executor);
    const cleanupEffects = testHarness.getAddedEffects(EffectTriggerType.CLEANUP_START);

    expect(cleanupEffects).toHaveLength(1);
    expect(cleanupEffects[0].isMandatory()).toBe(false);
    expect(cleanupEffects[0].areOtherConditionsSatisfied(testHarness.executor)).toBe(true);

    await cleanupEffects[0].doAction(testHarness.executor, undefined);

    expect(testHarness.inPlay.contains(alchemist)).toBe(false);
    expect(testHarness.inPlay.contains(potion)).toBe(true);
    expect(testHarness.deck.getTopCard()).toBe(alchemist);
  });

  it('does not offer to topdeck itself without a Potion in play', async () => {
    const testHarness = createCardHarness();
    const alchemist = new Alchemist(testHarness.sharedGameState);
    alchemist.setId('alchemist-in-play');
    testHarness.addToInPlay(alchemist);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-in-play');
    testHarness.addToInPlay(copper);

    await alchemist.play(testHarness.executor);
    const [cleanupEffect] = testHarness.getAddedEffects(EffectTriggerType.CLEANUP_START);

    expect(cleanupEffect.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
  });

  it('does not offer to topdeck itself once it has left play', async () => {
    const testHarness = createCardHarness();
    const alchemist = new Alchemist(testHarness.sharedGameState);
    alchemist.setId('alchemist-in-play');
    testHarness.addToInPlay(alchemist);
    const potion = new Potion(testHarness.sharedGameState);
    potion.setId('potion-in-play');
    testHarness.addToInPlay(potion);

    await alchemist.play(testHarness.executor);
    testHarness.inPlay.removeCard(alchemist);
    testHarness.addToDiscard(alchemist);
    const [cleanupEffect] = testHarness.getAddedEffects(EffectTriggerType.CLEANUP_START);

    expect(cleanupEffect.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
  });
});
