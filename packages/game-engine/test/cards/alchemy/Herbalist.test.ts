import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Herbalist } from '../../../src/cards/alchemy/Herbalist';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

const cardIds = (cards: Iterable<Card>): string[] => Array.from(cards, (card) => card.getId());

describe('Herbalist', () => {
  it('gives +1 Buy and +$1', async () => {
    const testHarness = createCardHarness();

    await new Herbalist(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });

  it('lets you put a Treasure from play onto your deck during Clean-up', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-in-play');
    testHarness.addToInPlay(copper);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-in-play');
    testHarness.addToInPlay(gold);

    await new Herbalist(testHarness.sharedGameState).play(testHarness.executor);
    const cleanupEffects = testHarness.getAddedEffects(EffectTriggerType.CLEANUP_START);
    expect(cleanupEffects).toHaveLength(1);

    testHarness.pickCard(gold);
    await cleanupEffects[0].doAction(testHarness.executor, undefined);

    expect(cardIds(testHarness.deck)).toEqual([gold.getId()]);
    expect(cardIds(testHarness.inPlay)).toEqual([copper.getId()]);
    // only once this turn
    expect(cleanupEffects[0].hasExpired()).toBe(true);
  });

  it('leaves Treasures in play when none is chosen', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-in-play');
    testHarness.addToInPlay(copper);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-in-play');
    testHarness.addToInPlay(gold);

    await new Herbalist(testHarness.sharedGameState).play(testHarness.executor);
    const [cleanupEffect] = testHarness.getAddedEffects(EffectTriggerType.CLEANUP_START);
    // default: choice returns none
    await cleanupEffect.doAction(testHarness.executor, undefined);

    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.inPlay.size()).toBe(2);
  });

  it('does not topdeck non-Treasure cards from play', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-in-play');
    testHarness.addToInPlay(village);

    await new Herbalist(testHarness.sharedGameState).play(testHarness.executor);
    const [cleanupEffect] = testHarness.getAddedEffects(EffectTriggerType.CLEANUP_START);
    testHarness.pickCard(village);
    await cleanupEffect.doAction(testHarness.executor, undefined);

    expect(testHarness.deck.size()).toBe(0);
    expect(cardIds(testHarness.inPlay)).toEqual([village.getId()]);
  });
});
