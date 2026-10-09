import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Hovel } from '../../../src/cards/dark_ages/Hovel';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Hovel', () => {
  it('may be trashed from hand when you gain a Victory card', async () => {
    const testHarness = createCardHarness();
    const hovel = new Hovel(testHarness.sharedGameState);
    hovel.setId('hovel-0');
    testHarness.addToHand(hovel);
    const gainedEstate = new Estate(testHarness.sharedGameState);
    gainedEstate.setId('estate-gained-0');
    testHarness.addToDiscard(gainedEstate);

    const [onGain] = testHarness.getCardEffects(hovel, EffectTriggerType.GAIN);
    expect(onGain.isMandatory()).toBe(false);
    expect(onGain.getCardEligibility().matches(gainedEstate)).toBe(true);
    expect(onGain.areOtherConditionsSatisfied(testHarness.executor)).toBe(true);
    await onGain.doAction(testHarness.executor, gainedEstate);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([hovel]);
    expect(hovel.getLocation()).toBe(CardLocation.TRASH);
    expect(testHarness.discard.asCardArray()).toEqual([gainedEstate]);
  });

  it('does not react to gaining a non-Victory card', () => {
    const testHarness = createCardHarness();
    const hovel = new Hovel(testHarness.sharedGameState);
    hovel.setId('hovel-0');
    testHarness.addToHand(hovel);
    const gainedCopper = new Copper(testHarness.sharedGameState);
    gainedCopper.setId('copper-gained-0');

    const [onGain] = testHarness.getCardEffects(hovel, EffectTriggerType.GAIN);

    expect(onGain.getCardEligibility().matches(gainedCopper)).toBe(false);
  });

  it('only reacts while in hand', () => {
    const testHarness = createCardHarness();
    const hovel = new Hovel(testHarness.sharedGameState);
    hovel.setId('hovel-0');
    testHarness.addToDeck(hovel);

    const [onGain] = testHarness.getCardEffects(hovel, EffectTriggerType.GAIN);

    expect(onGain.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
  });
});
