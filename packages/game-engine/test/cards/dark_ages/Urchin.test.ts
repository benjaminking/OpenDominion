import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Militia } from '../../../src/cards/base_game/Militia';
import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Mercenary } from '../../../src/cards/dark_ages/Mercenary';
import { Urchin } from '../../../src/cards/dark_ages/Urchin';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

const setUp = (numTargetHandCards: number) => {
  const testHarness = createCardHarness();
  const targetHarness = createCardHarness();
  testHarness.routeAttacksTo(targetHarness);
  const urchin = new Urchin(testHarness.sharedGameState);
  urchin.setId('urchin-in-play');
  testHarness.addToInPlay(urchin);
  const deckCopper = new Copper(testHarness.sharedGameState);
  deckCopper.setId('copper-deck-0');
  testHarness.addToDeck(deckCopper);
  const mercenary = new Mercenary(testHarness.sharedGameState);
  mercenary.setId('mercenary-pile-0');
  testHarness.pileCards.set('Mercenary', [mercenary]);
  const targetHand: Copper[] = [];
  for (let i = 0; i < numTargetHandCards; i++) {
    const handCopper = new Copper(targetHarness.sharedGameState);
    handCopper.setId(`copper-target-hand-${String(i)}`);
    targetHand.push(handCopper);
    targetHarness.addToHand(handCopper);
  }
  return { testHarness, targetHarness, urchin, targetHand };
};

describe('Urchin', () => {
  it('gives +1 Card and +1 Action, and each other player discards down to 4', async () => {
    const { testHarness, targetHarness, urchin, targetHand } = setUp(6);

    targetHarness.pickCards([targetHand[0], targetHand[1]]);
    await urchin.play(testHarness.executor);

    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0']);
    expect(testHarness.stats.actions).toBe(1);
    expect(targetHarness.hand.size()).toBe(4);
    expect(idsOf(targetHarness.discard)).toEqual(['copper-target-hand-0', 'copper-target-hand-1']);
  });

  it('attack does not make a player with 4 or fewer cards discard', async () => {
    const { testHarness, targetHarness, urchin } = setUp(4);

    await urchin.play(testHarness.executor);

    expect(targetHarness.hand.size()).toBe(4);
    expect(targetHarness.discard.size()).toBe(0);
  });

  it('may be trashed to gain a Mercenary when another Attack card is played while it is in play', async () => {
    const { testHarness, urchin } = setUp(0);
    const militia = new Militia(testHarness.sharedGameState);
    militia.setId('militia-in-play');

    await urchin.play(testHarness.executor);
    const [onAttackPlayed] = testHarness.getAddedEffects(EffectTriggerType.PLAYED_CARD);
    expect(onAttackPlayed.isMandatory()).toBe(false);
    expect(onAttackPlayed.areOtherConditionsSatisfied(testHarness.executor)).toBe(true);
    await onAttackPlayed.doAction(testHarness.executor, militia);

    expect(testHarness.inPlay.size()).toBe(0);
    expect(idsOf(testHarness.sharedTrash)).toEqual(['urchin-in-play']);
    expect(idsOf(testHarness.discard)).toEqual(['mercenary-pile-0']);
    expect(testHarness.pileCards.get('Mercenary')).toHaveLength(0);
  });

  it('trash-for-Mercenary only triggers on another Attack card', async () => {
    const { testHarness, urchin } = setUp(0);
    const militia = new Militia(testHarness.sharedGameState);
    militia.setId('militia-0');
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-0');
    const otherUrchin = new Urchin(testHarness.sharedGameState);
    otherUrchin.setId('urchin-other');

    await urchin.play(testHarness.executor);
    const [onAttackPlayed] = testHarness.getAddedEffects(EffectTriggerType.PLAYED_CARD);

    expect(onAttackPlayed.getCardEligibility().matches(militia)).toBe(true);
    expect(onAttackPlayed.getCardEligibility().matches(otherUrchin)).toBe(true);
    expect(onAttackPlayed.getCardEligibility().matches(smithy)).toBe(false);
    expect(onAttackPlayed.getCardEligibility().matches(urchin)).toBe(false);
  });

  it('trash-for-Mercenary is unavailable once Urchin has left play', async () => {
    const { testHarness, urchin } = setUp(0);
    const militia = new Militia(testHarness.sharedGameState);
    militia.setId('militia-in-play');

    await urchin.play(testHarness.executor);
    const [onAttackPlayed] = testHarness.getAddedEffects(EffectTriggerType.PLAYED_CARD);
    testHarness.inPlay.removeCard(urchin);
    testHarness.addToDiscard(urchin);

    expect(onAttackPlayed.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
    await onAttackPlayed.doAction(testHarness.executor, militia);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(idsOf(testHarness.discard)).toEqual(['urchin-in-play']);
  });

  // BUG: the effect fires on PLAYED_CARD (after the Attack resolves), but the card says "you may first trash this"
  it('offers the trash-for-Mercenary before the other Attack card resolves', async () => {
    const { testHarness, urchin } = setUp(0);

    await urchin.play(testHarness.executor);
    const addedEffects = testHarness.getAddedEffects();

    expect(addedEffects).toHaveLength(1);
    expect(addedEffects[0].getTrigger()).toBe(EffectTriggerType.ABOUT_TO_PLAY_CARD);
  });
});
