import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Cauldron } from '../../../src/cards/hinterlands/Cauldron';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const gainVillages = (testHarness: CardHarness, numVillages: number): Village[] => {
  const villages: Village[] = [];
  for (let i = 0; i < numVillages; i++) {
    const village = new Village(testHarness.sharedGameState);
    village.setId(`village-gained-${String(i)}`);
    testHarness.addToDiscard(village);
    testHarness.turnTracker.addGainedCard(village);
    villages.push(village);
  }
  return villages;
};

describe('Cauldron', () => {
  it('produces $2 and +1 Buy', async () => {
    const testHarness = createCardHarness();

    await new Cauldron(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.stats.buys).toBe(1);
  });

  it('watches for gaining Action cards for the rest of the turn', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-0');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-0');

    await new Cauldron(testHarness.sharedGameState).play(testHarness.executor);

    const gainEffects = testHarness.getAddedEffects(EffectTriggerType.GAIN);
    expect(gainEffects).toHaveLength(1);
    expect(gainEffects[0].getCardEligibility().matches(village)).toBe(true);
    expect(gainEffects[0].getCardEligibility().matches(silver)).toBe(false);
  });

  it('does not trigger on the second Action gained this turn', async () => {
    const testHarness = createCardHarness();
    await new Cauldron(testHarness.sharedGameState).play(testHarness.executor);
    gainVillages(testHarness, 2);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-gained');
    testHarness.turnTracker.addGainedCard(silver);

    const [onGain] = testHarness.getAddedEffects(EffectTriggerType.GAIN);

    expect(onGain.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
  });

  it('makes each other player gain a Curse the third time you gain an Action this turn', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    const curse = new Curse(targetHarness.sharedGameState);
    curse.setId('curse-supply-0');
    targetHarness.addSupplyPile(curse);
    await new Cauldron(testHarness.sharedGameState).play(testHarness.executor);
    const villages = gainVillages(testHarness, 3);

    const [onGain] = testHarness.getAddedEffects(EffectTriggerType.GAIN);
    expect(onGain.areOtherConditionsSatisfied(testHarness.executor)).toBe(true);
    await onGain.doAction(testHarness.executor, villages[2]);

    expect(targetHarness.discard.size()).toBe(1);
    expect(targetHarness.discard.contains(curse)).toBe(true);
    expect(testHarness.discard.size()).toBe(3);
  });

  it('does not trigger again on the fourth Action gained this turn', async () => {
    const testHarness = createCardHarness();
    await new Cauldron(testHarness.sharedGameState).play(testHarness.executor);
    gainVillages(testHarness, 4);

    const [onGain] = testHarness.getAddedEffects(EffectTriggerType.GAIN);

    expect(onGain.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
  });
});
