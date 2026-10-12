import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { HuntingGrounds } from '../../../src/cards/dark_ages/HuntingGrounds';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const addEstatesToSupply = (testHarness: CardHarness, count: number): void => {
  for (let cardIndex = 0; cardIndex < count; cardIndex++) {
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId(`estate-supply-${String(cardIndex)}`);
    testHarness.addSupplyPile(estate);
  }
};

describe('HuntingGrounds', () => {
  it('draws 4 cards', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new HuntingGrounds(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(4);
    expect(testHarness.deck.size()).toBe(1);
  });

  it('when trashed, may gain a Duchy', async () => {
    const testHarness = createCardHarness();
    const huntingGrounds = new HuntingGrounds(testHarness.sharedGameState);
    huntingGrounds.setId('hunting-grounds-0');
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);
    addEstatesToSupply(testHarness, 3);

    const [onTrash] = testHarness.getCardEffects(huntingGrounds, EffectTriggerType.TRASH);
    testHarness.pickOption('Gain a Duchy');
    await onTrash.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(huntingGrounds).build());

    expect(testHarness.discard.asCardArray()).toEqual([duchy]);
    expect(testHarness.pileCards.get('Estate')).toHaveLength(3);
  });

  it('when trashed, may gain 3 Estates', async () => {
    const testHarness = createCardHarness();
    const huntingGrounds = new HuntingGrounds(testHarness.sharedGameState);
    huntingGrounds.setId('hunting-grounds-0');
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);
    addEstatesToSupply(testHarness, 4);

    const [onTrash] = testHarness.getCardEffects(huntingGrounds, EffectTriggerType.TRASH);
    testHarness.pickOption('Gain 3 Estates');
    await onTrash.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(huntingGrounds).build());

    expect(testHarness.discard.size()).toBe(3);
    expect(testHarness.discard.asCardArray().every((card) => card.getName() === 'Estate')).toBe(true);
    expect(testHarness.pileCards.get('Estate')).toHaveLength(1);
    expect(testHarness.pileCards.get('Duchy')).toEqual([duchy]);
  });

  it('when trashed with fewer than 3 Estates left, gains the remaining Estates', async () => {
    const testHarness = createCardHarness();
    const huntingGrounds = new HuntingGrounds(testHarness.sharedGameState);
    huntingGrounds.setId('hunting-grounds-0');
    addEstatesToSupply(testHarness, 2);

    const [onTrash] = testHarness.getCardEffects(huntingGrounds, EffectTriggerType.TRASH);
    testHarness.pickOption('Gain 3 Estates');
    await onTrash.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(huntingGrounds).build());

    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.pileCards.get('Estate')).toEqual([]);
  });
});
