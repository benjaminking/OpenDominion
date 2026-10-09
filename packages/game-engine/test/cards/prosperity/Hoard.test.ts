import { describe, expect, it } from 'vitest';

import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Hoard } from '../../../src/cards/prosperity/Hoard';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const addGoldPile = (testHarness: CardHarness): void => {
  const gold = new Gold(testHarness.sharedGameState);
  gold.setId('gold-supply-0');
  testHarness.addSupplyPile(gold);
};

describe('Hoard', () => {
  it('adds $2', async () => {
    const testHarness = createCardHarness();

    await new Hoard(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
  });

  it('gains a Gold this turn when you buy a Victory card', async () => {
    const testHarness = createCardHarness();
    addGoldPile(testHarness);
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);

    await new Hoard(testHarness.sharedGameState).play(testHarness.executor);
    testHarness.stats.coins += 3;
    const boughtDuchy = await testHarness.executor.buyFromPile('Duchy');

    const gainEffects = testHarness.getAddedEffects(EffectTriggerType.GAIN);
    expect(gainEffects).toHaveLength(1);
    expect(gainEffects[0].isMandatory()).toBe(true);
    expect(gainEffects[0].getCardEligibility().matches(duchy)).toBe(true);
    await gainEffects[0].doAction(testHarness.executor, boughtDuchy);

    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['duchy-supply-0', 'gold-supply-0']);
  });

  it('does not apply to bought non-Victory cards or to later turns', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    await new Hoard(testHarness.sharedGameState).play(testHarness.executor);
    await testHarness.executor.buyFromPile('Silver');

    const gainEffect = testHarness.getAddedEffects(EffectTriggerType.GAIN)[0];
    const thisTurn = testHarness.turnTracker.getCurrentTurn();
    expect(gainEffect.getCardEligibility().matches(silver)).toBe(false);
    expect(gainEffect.getTurnEligibility().matches(thisTurn)).toBe(true);
    expect(gainEffect.getTurnEligibility().matches(thisTurn.nextTurn())).toBe(false);
  });

  it('does not apply to a Victory card gained without buying it', async () => {
    const testHarness = createCardHarness();
    addGoldPile(testHarness);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-supply-0');
    testHarness.addSupplyPile(estate);

    await new Hoard(testHarness.sharedGameState).play(testHarness.executor);
    await testHarness.executor.gainCardFromPile(estate);

    const gainEffect = testHarness.getAddedEffects(EffectTriggerType.GAIN)[0];
    expect(gainEffect.getCardEligibility().matches(estate)).toBe(false);
  });
});
