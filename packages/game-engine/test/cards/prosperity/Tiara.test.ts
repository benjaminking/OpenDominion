import { CardChoice } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Tiara } from '../../../src/cards/prosperity/Tiara';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Tiara', () => {
  it('adds +1 Buy and plays a chosen Treasure from hand twice', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);

    testHarness.pickCard(silver);
    await new Tiara(testHarness.sharedGameState).play(testHarness.executor);

    const offeredChoices = (testHarness.decisionService.chooseCard.mock.calls[0] as unknown[])[3] as CardChoice[];
    expect(offeredChoices.map((choice) => choice.card.id)).toEqual(['silver-hand-0']);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(4);
    expect(testHarness.inPlay.asCardArray().map((card) => card.getId())).toEqual(['silver-hand-0']);
    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['village-hand-0']);
  });

  it('plays no Treasure when none is chosen', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);

    // default: choice returns none
    await new Tiara(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.hand.contains(silver)).toBe(true);
  });

  it('lets you put cards you gain this turn onto your deck', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply-0');
    testHarness.addSupplyPile(supplySilver);

    await new Tiara(testHarness.sharedGameState).play(testHarness.executor);
    await testHarness.executor.gainCardFromPile(supplySilver);

    const gainEffects = testHarness.getAddedEffects(EffectTriggerType.GAIN);
    expect(gainEffects).toHaveLength(1);
    expect(gainEffects[0].isMandatory()).toBe(false);
    await gainEffects[0].doAction(testHarness.executor, supplySilver);

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.deck.asCardArray().map((card) => card.getId())).toEqual(['copper-deck-0', 'silver-supply-0']);
  });

  it('only lets you put gained cards onto your deck this turn', async () => {
    const testHarness = createCardHarness();

    await new Tiara(testHarness.sharedGameState).play(testHarness.executor);

    const gainEffect = testHarness.getAddedEffects(EffectTriggerType.GAIN)[0];
    const thisTurn = testHarness.turnTracker.getCurrentTurn();
    expect(gainEffect.getTurnEligibility().matches(thisTurn)).toBe(true);
    expect(gainEffect.getTurnEligibility().matches(thisTurn.nextTurn())).toBe(false);
  });
});
