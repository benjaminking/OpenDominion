import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, CardInfo, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Vineyard } from '../../../src/cards/alchemy/Vineyard';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Province } from '../../../src/cards/basic_cards/Province';
import { Battlefield } from '../../../src/cards/empires/Battlefield';
import { Effect } from '../../../src/effects/Effect';
import { EffectSource } from '../../../src/effects/EffectSource';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

// Empires is not registered in CardInfoLookup yet, so supply Battlefield's card info directly
const battlefieldInfo: CardInfo = {
  name: 'Battlefield',
  category: CardCategory.LANDMARK,
  text: 'When you gain a Victory card, take 2 from here.',
  font_size: 'large',
  cost: { coins: 0 },
  types: [],
  expansion: Expansion.EMPIRES,
  has_randomizer: false,
};
const lookUpRegisteredCardInfo = CardInfoLookup.lookUpCardInfo.bind(CardInfoLookup);
vi.spyOn(CardInfoLookup, 'lookUpCardInfo').mockImplementation((cardName: string) =>
  cardName === battlefieldInfo.name ? battlefieldInfo : lookUpRegisteredCardInfo(cardName),
);

const getGainEffect = (battlefield: Battlefield): Effect => {
  const gainEffects = battlefield.getEffects().filter((effect) => effect.getTrigger() === EffectTriggerType.GAIN);
  expect(gainEffects).toHaveLength(1);
  return gainEffects[0];
};

describe('Battlefield', () => {
  it('gives 2 VP when you gain a Victory card', async () => {
    const testHarness = createCardHarness();
    const battlefield = new Battlefield(testHarness.sharedGameState);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-gained');
    testHarness.addToDiscard(estate);

    const gainEffect = getGainEffect(battlefield);
    expect(gainEffect.getSource()).toBe(EffectSource.SELF);
    await gainEffect.doAction(testHarness.executor, estate);

    expect(testHarness.stats.vp).toBe(2);
  });

  it('only triggers on gaining Victory cards', () => {
    const testHarness = createCardHarness();
    const gainEffect = getGainEffect(new Battlefield(testHarness.sharedGameState));
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-0');
    const province = new Province(testHarness.sharedGameState);
    province.setId('province-0');
    const vineyard = new Vineyard(testHarness.sharedGameState);
    vineyard.setId('vineyard-0');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-0');
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-0');
    const curse = new Curse(testHarness.sharedGameState);
    curse.setId('curse-0');

    expect(gainEffect.getCardEligibility().matches(estate)).toBe(true);
    expect(gainEffect.getCardEligibility().matches(province)).toBe(true);
    expect(gainEffect.getCardEligibility().matches(vineyard)).toBe(true);
    expect(gainEffect.getCardEligibility().matches(copper)).toBe(false);
    expect(gainEffect.getCardEligibility().matches(village)).toBe(false);
    expect(gainEffect.getCardEligibility().matches(curse)).toBe(false);
  });

  it('starts with 6 VP per player and stops giving VP once empty', async () => {
    const testHarness = createCardHarness();
    // the harness reports 2 players
    const gainEffect = getGainEffect(new Battlefield(testHarness.sharedGameState));

    for (let i = 0; i < 7; i++) {
      const estate = new Estate(testHarness.sharedGameState);
      estate.setId(`estate-gained-${String(i)}`);
      await gainEffect.doAction(testHarness.executor, estate);
    }

    expect(testHarness.stats.vp).toBe(12);
  });

  it('scales its starting VP with the number of players', async () => {
    const testHarness = createCardHarness();
    vi.mocked(testHarness.sharedGameState.getNumPlayers).mockReturnValue(3);
    const gainEffect = getGainEffect(new Battlefield(testHarness.sharedGameState));

    for (let i = 0; i < 10; i++) {
      const estate = new Estate(testHarness.sharedGameState);
      estate.setId(`estate-gained-${String(i)}`);
      await gainEffect.doAction(testHarness.executor, estate);
    }

    expect(testHarness.stats.vp).toBe(18);
  });

  it('shares its VP between players', async () => {
    const testHarness = createCardHarness();
    const otherHarness = createCardHarness();
    const gainEffect = getGainEffect(new Battlefield(testHarness.sharedGameState));

    for (let i = 0; i < 4; i++) {
      const estate = new Estate(testHarness.sharedGameState);
      estate.setId(`estate-gained-${String(i)}`);
      await gainEffect.doAction(testHarness.executor, estate);
    }
    for (let i = 0; i < 3; i++) {
      const otherEstate = new Estate(otherHarness.sharedGameState);
      otherEstate.setId(`estate-other-gained-${String(i)}`);
      await gainEffect.doAction(otherHarness.executor, otherEstate);
    }

    expect(testHarness.stats.vp).toBe(8);
    expect(otherHarness.stats.vp).toBe(4);
  });

  it('is not worth VP itself at the end of the game', () => {
    const testHarness = createCardHarness();
    const battlefield = new Battlefield(testHarness.sharedGameState);

    expect(battlefield.score([])).toBe(0);
  });
});
