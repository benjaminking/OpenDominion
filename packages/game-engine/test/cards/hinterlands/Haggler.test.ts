import { describe, expect, it } from 'vitest';

import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Haggler } from '../../../src/cards/hinterlands/Haggler';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const buyAndGain = (testHarness: CardHarness, id: string): Gold => {
  const boughtGold = new Gold(testHarness.sharedGameState);
  boughtGold.setId(id);
  testHarness.turnTracker.addBoughtCard(boughtGold);
  testHarness.addToDiscard(boughtGold);
  testHarness.turnTracker.addGainedCard(boughtGold);
  return boughtGold;
};

describe('Haggler', () => {
  it('adds $2', async () => {
    const testHarness = createCardHarness();

    await new Haggler(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
  });

  it('when you gain a card you bought this turn, gains a cheaper non-Victory card', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);
    await new Haggler(testHarness.sharedGameState).play(testHarness.executor);
    const boughtGold = buyAndGain(testHarness, 'gold-bought');

    const [onGain] = testHarness.getAddedEffects(EffectTriggerType.GAIN);
    expect(onGain.getCardEligibility().matches(boughtGold)).toBe(true);
    testHarness.pickCard(silver);
    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(boughtGold).withGainLocation(boughtGold.getLocation()).build(),
    );

    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.discard.contains(silver)).toBe(true);
  });

  it('cannot gain a Victory card or a card that is not cheaper', async () => {
    const testHarness = createCardHarness();
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);
    const supplyGold = new Gold(testHarness.sharedGameState);
    supplyGold.setId('gold-supply-0');
    testHarness.addSupplyPile(supplyGold);
    await new Haggler(testHarness.sharedGameState).play(testHarness.executor);
    const boughtGold = buyAndGain(testHarness, 'gold-bought');

    const [onGain] = testHarness.getAddedEffects(EffectTriggerType.GAIN);
    testHarness.pickCard(duchy);
    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(boughtGold).withGainLocation(boughtGold.getLocation()).build(),
    );

    expect(testHarness.discard.size()).toBe(1);
  });

  it('does not trigger when you gain a card you did not buy', async () => {
    const testHarness = createCardHarness();
    await new Haggler(testHarness.sharedGameState).play(testHarness.executor);
    buyAndGain(testHarness, 'gold-bought');
    const gainedSilver = new Silver(testHarness.sharedGameState);
    gainedSilver.setId('silver-gained-not-bought');
    testHarness.addToDiscard(gainedSilver);
    testHarness.turnTracker.addGainedCard(gainedSilver);

    const [onGain] = testHarness.getAddedEffects(EffectTriggerType.GAIN);

    expect(onGain.getCardEligibility().matches(gainedSilver)).toBe(false);
  });
});
