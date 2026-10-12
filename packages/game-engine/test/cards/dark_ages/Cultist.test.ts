import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { AbandonedMine } from '../../../src/cards/dark_ages/AbandonedMine';
import { Cultist } from '../../../src/cards/dark_ages/Cultist';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const addCoppersToDeck = (testHarness: CardHarness, count: number): void => {
  for (let cardIndex = 0; cardIndex < count; cardIndex++) {
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId(`copper-deck-${String(cardIndex)}`);
    testHarness.addToDeck(deckCopper);
  }
};

const addRuinsToSupply = (testHarness: CardHarness, count: number): void => {
  for (let cardIndex = 0; cardIndex < count; cardIndex++) {
    const ruins = new AbandonedMine(testHarness.sharedGameState);
    ruins.setId(`ruins-supply-${String(cardIndex)}`);
    testHarness.addSupplyPile(ruins);
  }
};

describe('Cultist', () => {
  it('draws 2 cards', async () => {
    const testHarness = createCardHarness();
    addCoppersToDeck(testHarness, 3);

    await new Cultist(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(1);
  });

  it('attack makes each other player gain a Ruins', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    addRuinsToSupply(targetHarness, 2);
    testHarness.routeAttacksTo(targetHarness);

    await new Cultist(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.discard.size()).toBe(1);
    expect(targetHarness.discard.asCardArray()[0].getPileName()).toBe('Ruins');
    expect(targetHarness.pileCards.get('Ruins')).toHaveLength(1);
  });

  it('attack does nothing when the Ruins pile is empty', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    targetHarness.pileCards.set('Ruins', []);
    testHarness.routeAttacksTo(targetHarness);

    await new Cultist(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.discard.size()).toBe(0);
  });

  it('may play another Cultist from hand', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    addRuinsToSupply(targetHarness, 3);
    testHarness.routeAttacksTo(targetHarness);
    addCoppersToDeck(testHarness, 5);
    const secondCultist = new Cultist(testHarness.sharedGameState);
    secondCultist.setId('cultist-hand-0');
    testHarness.addToHand(secondCultist);

    testHarness.pickCard(secondCultist);
    await new Cultist(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.inPlay.asCardArray()).toEqual([secondCultist]);
    expect(testHarness.hand.size()).toBe(4);
    expect(testHarness.deck.size()).toBe(1);
    expect(targetHarness.discard.size()).toBe(2);
  });

  it('may decline to play another Cultist', async () => {
    const testHarness = createCardHarness();
    const secondCultist = new Cultist(testHarness.sharedGameState);
    secondCultist.setId('cultist-hand-0');
    testHarness.addToHand(secondCultist);

    // default decision: none
    await new Cultist(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([secondCultist]);
    expect(testHarness.inPlay.size()).toBe(0);
  });

  it('playing another Cultist from hand does not use an Action', async () => {
    const testHarness = createCardHarness();
    const secondCultist = new Cultist(testHarness.sharedGameState);
    secondCultist.setId('cultist-hand-0');
    testHarness.addToHand(secondCultist);

    testHarness.pickCard(secondCultist);
    await new Cultist(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.inPlay.asCardArray()).toEqual([secondCultist]);
    expect(testHarness.stats.actions).toBe(0);
  });

  it('when trashed, draws 3 cards', async () => {
    const testHarness = createCardHarness();
    addCoppersToDeck(testHarness, 4);
    const cultist = new Cultist(testHarness.sharedGameState);
    cultist.setId('cultist-0');
    testHarness.addToInPlay(cultist);

    await testHarness.executor.trashCardFromLocation(cultist, CardLocation.IN_PLAY);
    const [onTrash] = testHarness.getCardEffects(cultist, EffectTriggerType.TRASH);
    await onTrash.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(cultist).build());

    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.deck.size()).toBe(1);
  });
});
