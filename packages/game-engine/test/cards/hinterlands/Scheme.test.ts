import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Scheme } from '../../../src/cards/hinterlands/Scheme';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Scheme', () => {
  it('draws a card and adds an action', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    await new Scheme(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('lets you put one Action card from play onto your deck at Clean-up, once', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-in-play');
    testHarness.addToInPlay(village);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-in-play');
    testHarness.addToInPlay(copper);
    await new Scheme(testHarness.sharedGameState).play(testHarness.executor);

    const [atCleanup] = testHarness.getAddedEffects(EffectTriggerType.CLEANUP_START);
    testHarness.pickCard(village);
    await atCleanup.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.deck.asCardArray().map((card) => card.getId())).toEqual(['village-in-play']);
    expect(testHarness.inPlay.contains(village)).toBe(false);
    expect(testHarness.inPlay.contains(copper)).toBe(true);
    expect(atCleanup.hasExpired()).toBe(true);
  });

  it('may leave every card in play', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-in-play');
    testHarness.addToInPlay(village);
    await new Scheme(testHarness.sharedGameState).play(testHarness.executor);

    const [atCleanup] = testHarness.getAddedEffects(EffectTriggerType.CLEANUP_START);
    await atCleanup.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.inPlay.contains(village)).toBe(true);
    expect(testHarness.deck.size()).toBe(0);
  });

  it('cannot put a non-Action card from play onto the deck', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-in-play');
    testHarness.addToInPlay(copper);
    await new Scheme(testHarness.sharedGameState).play(testHarness.executor);

    const [atCleanup] = testHarness.getAddedEffects(EffectTriggerType.CLEANUP_START);
    testHarness.pickCard(copper);
    await atCleanup.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.inPlay.contains(copper)).toBe(true);
    expect(testHarness.deck.size()).toBe(0);
  });
});
