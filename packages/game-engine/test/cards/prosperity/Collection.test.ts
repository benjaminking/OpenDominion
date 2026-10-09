import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Collection } from '../../../src/cards/prosperity/Collection';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Collection', () => {
  it('adds $2 and +1 Buy', async () => {
    const testHarness = createCardHarness();

    await new Collection(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.vp).toBe(0);
  });

  it('gives +1 VP this turn when you gain an Action card', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');
    testHarness.addSupplyPile(village);

    await new Collection(testHarness.sharedGameState).play(testHarness.executor);
    await testHarness.executor.gainCardFromPile(village);

    const gainEffects = testHarness.getAddedEffects(EffectTriggerType.GAIN);
    expect(gainEffects).toHaveLength(1);
    expect(gainEffects[0].isMandatory()).toBe(true);
    expect(gainEffects[0].getCardEligibility().matches(village)).toBe(true);
    await gainEffects[0].doAction(testHarness.executor, village);

    expect(testHarness.stats.vp).toBe(1);
  });

  it('does not apply to non-Action cards or to later turns', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-0');

    await new Collection(testHarness.sharedGameState).play(testHarness.executor);

    const gainEffect = testHarness.getAddedEffects(EffectTriggerType.GAIN)[0];
    const thisTurn = testHarness.turnTracker.getCurrentTurn();
    expect(gainEffect.getCardEligibility().matches(silver)).toBe(false);
    expect(gainEffect.getTurnEligibility().matches(thisTurn)).toBe(true);
    expect(gainEffect.getTurnEligibility().matches(thisTurn.nextTurn())).toBe(false);
  });
});
