import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { MerchantGuild } from '../../../src/cards/cornucopia_and_guilds/MerchantGuild';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { ThisTurnEligibility } from '../../../src/effects/StandardTurnEligibilityFunctions';
import { TurnPhase } from '../../../src/turns/TurnPhase';
import { createCardHarness } from '../testHarness';

describe('MerchantGuild', () => {
  it('gives +1 Buy and +$1', async () => {
    const testHarness = createCardHarness();

    await new MerchantGuild(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });

  it('at the end of the Buy phase gives +1 Coffers per card gained in that Buy phase', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');
    testHarness.addSupplyPile(village);

    await new MerchantGuild(testHarness.sharedGameState).play(testHarness.executor);
    // An Action-phase gain does not count
    await testHarness.executor.gainFromPile('Silver');
    testHarness.turnTracker.updateTurnPhase(TurnPhase.BUY);
    await testHarness.executor.gainFromPile('Gold');
    await testHarness.executor.gainFromPile('Village');

    const [buyEndEffect] = testHarness.getAddedEffects(EffectTriggerType.BUY_END);
    expect(buyEndEffect.getTurnEligibility()).toBeInstanceOf(ThisTurnEligibility);
    await buyEndEffect.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.stats.coffers).toBe(2);
  });

  it('gives no Coffers if nothing was gained in the Buy phase', async () => {
    const testHarness = createCardHarness();

    await new MerchantGuild(testHarness.sharedGameState).play(testHarness.executor);
    testHarness.turnTracker.updateTurnPhase(TurnPhase.BUY);
    const [buyEndEffect] = testHarness.getAddedEffects(EffectTriggerType.BUY_END);
    await buyEndEffect.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.stats.coffers).toBe(0);
  });
});
