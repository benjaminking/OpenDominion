import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Beggar } from '../../../src/cards/dark_ages/Beggar';
import { EffectSource } from '../../../src/effects/EffectSource';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Beggar', () => {
  // BUG: gains from lowercase pile 'copper', but pile names are case-sensitive, so nothing is gained
  it('gains 3 Coppers to hand', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const supplyCopper = new Copper(testHarness.sharedGameState);
      supplyCopper.setId(`copper-supply-${String(cardIndex)}`);
      testHarness.addSupplyPile(supplyCopper);
    }

    await new Beggar(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.hand.asCardArray().every((card) => card.getName() === 'Copper')).toBe(true);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Copper')).toHaveLength(1);
  });

  // BUG: gains from lowercase pile 'copper', but pile names are case-sensitive, so nothing is gained
  it('gains only as many Coppers as remain in the pile', async () => {
    const testHarness = createCardHarness();
    const supplyCopper = new Copper(testHarness.sharedGameState);
    supplyCopper.setId('copper-supply-0');
    testHarness.addSupplyPile(supplyCopper);

    await new Beggar(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([supplyCopper]);
  });

  it('reacts to Attacks played by other players, optionally, only while in hand', () => {
    const testHarness = createCardHarness();
    const beggar = new Beggar(testHarness.sharedGameState);
    beggar.setId('beggar-0');

    const [reaction] = testHarness.getCardEffects(beggar, EffectTriggerType.ATTACK);
    expect(reaction.getSource()).toBe(EffectSource.OTHER_PLAYER);
    expect(reaction.isMandatory()).toBe(false);

    testHarness.addToDiscard(beggar);
    expect(reaction.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);

    testHarness.discard.removeCard(beggar);
    testHarness.addToHand(beggar);
    expect(reaction.areOtherConditionsSatisfied(testHarness.executor)).toBe(true);
  });

  // BUG: gains from lowercase pile 'silver', but pile names are case-sensitive, so nothing is gained
  it('reaction discards it to gain 2 Silvers, putting one onto the deck', async () => {
    const testHarness = createCardHarness();
    const beggar = new Beggar(testHarness.sharedGameState);
    beggar.setId('beggar-0');
    testHarness.addToHand(beggar);
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const supplySilver = new Silver(testHarness.sharedGameState);
      supplySilver.setId(`silver-supply-${String(cardIndex)}`);
      testHarness.addSupplyPile(supplySilver);
    }

    const [reaction] = testHarness.getCardEffects(beggar, EffectTriggerType.ATTACK);
    await reaction.doAction(testHarness.executor, undefined);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.discard.contains(beggar)).toBe(true);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.deck.getTopCard()?.getName()).toBe('Silver');
    expect(testHarness.deck.getTopCard()?.getLocation()).toBe(CardLocation.DECK);
    expect(testHarness.discard.asCardArray().filter((card) => card.getName() === 'Silver')).toHaveLength(1);
    expect(testHarness.pileCards.get('Silver')).toHaveLength(1);
  });

  it('reaction gains nothing if Beggar has already left the hand', async () => {
    const testHarness = createCardHarness();
    const beggar = new Beggar(testHarness.sharedGameState);
    beggar.setId('beggar-0');
    testHarness.addToInPlay(beggar);
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply-0');
    testHarness.addSupplyPile(supplySilver);

    const [reaction] = testHarness.getCardEffects(beggar, EffectTriggerType.ATTACK);
    await reaction.doAction(testHarness.executor, undefined);

    expect(testHarness.inPlay.asCardArray()).toEqual([beggar]);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Silver')).toEqual([supplySilver]);
  });
});
