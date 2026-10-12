import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Farmland } from '../../../src/cards/hinterlands/Farmland';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const addGainedFarmland = (testHarness: CardHarness): Farmland => {
  const farmland = new Farmland(testHarness.sharedGameState);
  farmland.setId('farmland-gained');
  testHarness.addToDiscard(farmland);
  return farmland;
};

describe('Farmland', () => {
  it('is worth 2 VP', () => {
    const testHarness = createCardHarness();

    expect(new Farmland(testHarness.sharedGameState).score([])).toBe(2);
  });

  it('when gained, trashes a hand card and gains a card costing exactly $2 more', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);
    const farmland = addGainedFarmland(testHarness);
    const [onGain] = testHarness.getCardEffects(farmland, EffectTriggerType.GAIN);

    testHarness.pickCard(estate);
    testHarness.pickCard(smithy);
    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(farmland).withGainLocation(farmland.getLocation()).build(),
    );

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.contains(estate)).toBe(true);
    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.discard.contains(smithy)).toBe(true);
  });

  it('when gained, can gain a non-Farmland card at the same cost as Farmland', async () => {
    const testHarness = createCardHarness();
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-hand-0');
    testHarness.addToHand(smithy);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);
    const farmland = addGainedFarmland(testHarness);
    const [onGain] = testHarness.getCardEffects(farmland, EffectTriggerType.GAIN);

    testHarness.pickCard(smithy);
    testHarness.pickCard(gold);
    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(farmland).withGainLocation(farmland.getLocation()).build(),
    );

    expect(testHarness.discard.contains(gold)).toBe(true);
  });

  it('when gained, cannot gain a Farmland or a card not costing exactly $2 more', async () => {
    const testHarness = createCardHarness();
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-hand-0');
    testHarness.addToHand(smithy);
    const supplyFarmland = new Farmland(testHarness.sharedGameState);
    supplyFarmland.setId('farmland-supply-0');
    testHarness.addSupplyPile(supplyFarmland);
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);
    const farmland = addGainedFarmland(testHarness);
    const [onGain] = testHarness.getCardEffects(farmland, EffectTriggerType.GAIN);

    testHarness.pickCard(smithy);
    testHarness.pickCard(supplyFarmland);
    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(farmland).withGainLocation(farmland.getLocation()).build(),
    );

    expect(testHarness.sharedTrash.contains(smithy)).toBe(true);
    expect(testHarness.discard.size()).toBe(1);
  });

  it('when gained with an empty hand, does nothing', async () => {
    const testHarness = createCardHarness();
    const farmland = addGainedFarmland(testHarness);
    const [onGain] = testHarness.getCardEffects(farmland, EffectTriggerType.GAIN);

    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(farmland).withGainLocation(farmland.getLocation()).build(),
    );

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(1);
  });
});
