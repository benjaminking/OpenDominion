import { CardLocation } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Province } from '../../../src/cards/basic_cards/Province';
import { FoolsGold } from '../../../src/cards/hinterlands/FoolsGold';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectSource } from '../../../src/effects/EffectSource';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('FoolsGold', () => {
  it('produces $1 the first time it is played this turn', async () => {
    const testHarness = createCardHarness();
    const foolsGold = new FoolsGold(testHarness.sharedGameState);
    foolsGold.setId('fools-gold-0');
    testHarness.addToHand(foolsGold);

    await testHarness.executor.playCardFromHand(foolsGold);

    expect(testHarness.stats.coins).toBe(1);
  });

  it('produces $4 for each later Fools Gold played this turn', async () => {
    const testHarness = createCardHarness();
    const foolsGolds: FoolsGold[] = [];
    for (let i = 0; i < 3; i++) {
      const foolsGold = new FoolsGold(testHarness.sharedGameState);
      foolsGold.setId(`fools-gold-${String(i)}`);
      testHarness.addToHand(foolsGold);
      foolsGolds.push(foolsGold);
    }

    for (const foolsGold of foolsGolds) {
      await testHarness.executor.playCardFromHand(foolsGold);
    }

    expect(testHarness.stats.coins).toBe(9);
  });

  it('reacts only to another player gaining a Province, while in hand', () => {
    const testHarness = createCardHarness();
    const foolsGold = new FoolsGold(testHarness.sharedGameState);
    foolsGold.setId('fools-gold-0');
    testHarness.addToHand(foolsGold);
    const province = new Province(testHarness.sharedGameState);
    province.setId('province-gained-by-opponent');
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-gained-by-opponent');

    const [reaction] = testHarness.getCardEffects(foolsGold, EffectTriggerType.GAIN);

    expect(reaction.getSource()).toBe(EffectSource.OTHER_PLAYER);
    expect(reaction.getCardEligibility().matches(province)).toBe(true);
    expect(reaction.getCardEligibility().matches(duchy)).toBe(false);
    expect(reaction.areOtherConditionsSatisfied(testHarness.executor)).toBe(true);
    foolsGold.setLocation(CardLocation.DISCARD);
    expect(reaction.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
  });

  it('trashes itself from hand to gain a Gold onto the deck when reacting', async () => {
    const testHarness = createCardHarness();
    const foolsGold = new FoolsGold(testHarness.sharedGameState);
    foolsGold.setId('fools-gold-0');
    testHarness.addToHand(foolsGold);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);
    const province = new Province(testHarness.sharedGameState);
    province.setId('province-gained-by-opponent');
    const [reaction] = testHarness.getCardEffects(foolsGold, EffectTriggerType.GAIN);

    await reaction.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(province).build());

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.contains(foolsGold)).toBe(true);
    expect(testHarness.deck.asCardArray().map((card) => card.getId())).toEqual(['gold-supply-0']);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('loses track of itself, gaining no Gold, if it leaves the hand while it is revealed', async () => {
    const testHarness = createCardHarness();
    const foolsGold = new FoolsGold(testHarness.sharedGameState);
    foolsGold.setId('fools-gold-0');
    testHarness.addToHand(foolsGold);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);
    const province = new Province(testHarness.sharedGameState);
    province.setId('province-gained-by-opponent');
    const [reaction] = testHarness.getCardEffects(foolsGold, EffectTriggerType.GAIN);
    const lostTrack = vi.spyOn(testHarness.executor, 'sendLostTrackMessage');
    // Something reacting to the reveal moves it out of the hand
    vi.spyOn(testHarness.executor, 'revealCard').mockImplementation(() => {
      testHarness.hand.removeCard(foolsGold);
      testHarness.addToDiscard(foolsGold);
      return Promise.resolve();
    });

    await reaction.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(province).build());

    expect(lostTrack).toHaveBeenCalledWith(foolsGold);
    expect(testHarness.discard.asCardArray()).toEqual([foolsGold]);
    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.pileCards.get('Gold')).toContain(gold);
  });
});
