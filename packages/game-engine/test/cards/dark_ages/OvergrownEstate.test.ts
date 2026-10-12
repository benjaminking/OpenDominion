import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { OvergrownEstate } from '../../../src/cards/dark_ages/OvergrownEstate';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('OvergrownEstate', () => {
  it('is a Victory-Shelter worth 0 VP', () => {
    const testHarness = createCardHarness();
    const overgrownEstate = new OvergrownEstate(testHarness.sharedGameState);

    expect(overgrownEstate.score()).toBe(0);
    expect(overgrownEstate.hasType(CardType.VICTORY)).toBe(true);
    expect(overgrownEstate.hasType(CardType.SHELTER)).toBe(true);
  });

  it('draws a card when trashed', async () => {
    const testHarness = createCardHarness();
    const overgrownEstate = new OvergrownEstate(testHarness.sharedGameState);
    overgrownEstate.setId('overgrown-estate-0');
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    const [onTrash] = testHarness.getCardEffects(overgrownEstate, EffectTriggerType.TRASH);
    expect(onTrash.isMandatory()).toBe(true);
    await onTrash.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCards(CardCollection.fromCards([overgrownEstate])).build(),
    );

    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['copper-deck-0']);
  });

  it('on-trash effect only applies to this Overgrown Estate', () => {
    const testHarness = createCardHarness();
    const overgrownEstate = new OvergrownEstate(testHarness.sharedGameState);
    overgrownEstate.setId('overgrown-estate-0');
    const otherOvergrownEstate = new OvergrownEstate(testHarness.sharedGameState);
    otherOvergrownEstate.setId('overgrown-estate-1');

    const [onTrash] = testHarness.getCardEffects(overgrownEstate, EffectTriggerType.TRASH);

    expect(onTrash.isSelf()).toBe(true);
    expect(onTrash.getCardEligibility().matches(overgrownEstate)).toBe(true);
    expect(onTrash.getCardEligibility().matches(otherOvergrownEstate)).toBe(false);
  });
});
