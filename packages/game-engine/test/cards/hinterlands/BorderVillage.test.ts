import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { BorderVillage } from '../../../src/cards/hinterlands/BorderVillage';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('BorderVillage', () => {
  it('draws 1 card and adds 2 actions', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 2; i++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(i)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new BorderVillage(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(2);
  });

  it('gains a cheaper card when gained', async () => {
    const testHarness = createCardHarness();
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);
    const borderVillage = new BorderVillage(testHarness.sharedGameState);
    borderVillage.setId('border-village-gained');
    testHarness.addToDiscard(borderVillage);
    const [onGain] = testHarness.getCardEffects(borderVillage, EffectTriggerType.GAIN);

    testHarness.pickCard(duchy);
    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(borderVillage).withGainLocation(borderVillage.getLocation()).build(),
    );

    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.discard.contains(duchy)).toBe(true);
  });

  it('cannot gain a card costing as much as itself when gained', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);
    const supplyBorderVillage = new BorderVillage(testHarness.sharedGameState);
    supplyBorderVillage.setId('border-village-supply-0');
    testHarness.addSupplyPile(supplyBorderVillage);
    const borderVillage = new BorderVillage(testHarness.sharedGameState);
    borderVillage.setId('border-village-gained');
    testHarness.addToDiscard(borderVillage);
    const [onGain] = testHarness.getCardEffects(borderVillage, EffectTriggerType.GAIN);

    testHarness.pickCard(gold);
    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(borderVillage).withGainLocation(borderVillage.getLocation()).build(),
    );

    expect(testHarness.discard.size()).toBe(1);
  });
});
