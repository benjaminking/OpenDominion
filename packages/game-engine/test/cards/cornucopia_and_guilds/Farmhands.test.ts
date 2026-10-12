import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Farmhands } from '../../../src/cards/cornucopia_and_guilds/Farmhands';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { NextTurnEligibility } from '../../../src/effects/StandardTurnEligibilityFunctions';
import { createCardHarness } from '../testHarness';

describe('Farmhands', () => {
  it('gives +1 Card and +2 Actions', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);

    await new Farmhands(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([copper]);
    expect(testHarness.stats.actions).toBe(2);
  });

  it('when gained, sets aside a Treasure from hand and plays it at the start of the next turn', async () => {
    const testHarness = createCardHarness();
    const farmhands = new Farmhands(testHarness.sharedGameState);
    farmhands.setId('farmhands-0');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);

    testHarness.pickCard(silver);
    const [gainEffect] = testHarness.getCardEffects(farmhands, EffectTriggerType.GAIN);
    await gainEffect.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(farmhands).withGainLocation(farmhands.getLocation()).build());

    expect(testHarness.hand.size()).toBe(0);
    expect(silver.getLocation()).toBe(CardLocation.SET_ASIDE);
    const [turnStartEffect] = testHarness.getAddedEffects(EffectTriggerType.TURN_START);
    expect(turnStartEffect.getTurnEligibility()).toBeInstanceOf(NextTurnEligibility);
    expect(turnStartEffect.isMandatory()).toBe(true);

    await turnStartEffect.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.stats.coins).toBe(2);
  });

  it('moves the set-aside card into play when it is played', async () => {
    const testHarness = createCardHarness();
    const farmhands = new Farmhands(testHarness.sharedGameState);
    farmhands.setId('farmhands-0');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);

    testHarness.pickCard(silver);
    const [gainEffect] = testHarness.getCardEffects(farmhands, EffectTriggerType.GAIN);
    await gainEffect.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(farmhands).withGainLocation(farmhands.getLocation()).build());
    const [turnStartEffect] = testHarness.getAddedEffects(EffectTriggerType.TURN_START);
    await turnStartEffect.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.inPlay.asCardArray()).toEqual([silver]);
  });

  it('sets nothing aside when declined', async () => {
    const testHarness = createCardHarness();
    const farmhands = new Farmhands(testHarness.sharedGameState);
    farmhands.setId('farmhands-0');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);

    const [gainEffect] = testHarness.getCardEffects(farmhands, EffectTriggerType.GAIN);
    await gainEffect.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(farmhands).withGainLocation(farmhands.getLocation()).build());

    expect(testHarness.hand.asCardArray()).toEqual([silver]);
    expect(testHarness.getAddedEffects()).toHaveLength(0);
  });

  it('cannot set aside a card that is neither an Action nor a Treasure', async () => {
    const testHarness = createCardHarness();
    const farmhands = new Farmhands(testHarness.sharedGameState);
    farmhands.setId('farmhands-0');
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    testHarness.pickCard(estate);
    const [gainEffect] = testHarness.getCardEffects(farmhands, EffectTriggerType.GAIN);
    await gainEffect.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(farmhands).withGainLocation(farmhands.getLocation()).build());

    expect(testHarness.hand.asCardArray()).toEqual([estate]);
    expect(testHarness.getAddedEffects()).toHaveLength(0);
  });
});
