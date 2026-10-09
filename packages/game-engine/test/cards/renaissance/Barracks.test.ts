import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, CardInfo, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Barracks } from '../../../src/cards/renaissance/Barracks';
import { EffectSource } from '../../../src/effects/EffectSource';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

// Renaissance is not registered in CardInfoLookup yet, so supply Barracks' card info directly
const barracksInfo: CardInfo = {
  name: 'Barracks',
  category: CardCategory.PROJECT,
  text: 'At the start of your turn,\n+1 Action .',
  font_size: 'large',
  cost: { coins: 6 },
  types: [],
  expansion: Expansion.RENAISSANCE,
  has_randomizer: false,
};
const lookUpRegisteredCardInfo = CardInfoLookup.lookUpCardInfo.bind(CardInfoLookup);
vi.spyOn(CardInfoLookup, 'lookUpCardInfo').mockImplementation((cardName: string) =>
  cardName === barracksInfo.name ? barracksInfo : lookUpRegisteredCardInfo(cardName),
);

describe('Barracks', () => {
  it('gives +1 Action at the start of your turn', async () => {
    const testHarness = createCardHarness();
    const barracks = new Barracks(testHarness.sharedGameState);

    const effects = barracks.getEffects();
    expect(effects).toHaveLength(1);
    expect(effects[0].getTrigger()).toBe(EffectTriggerType.TURN_START);
    expect(effects[0].getSource()).toBe(EffectSource.SELF);

    await effects[0].doAction(testHarness.executor, undefined);

    expect(testHarness.stats.actions).toBe(1);
  });

  it('gives +1 Action on every turn', async () => {
    const testHarness = createCardHarness();
    const [turnStartEffect] = new Barracks(testHarness.sharedGameState).getEffects();

    await turnStartEffect.doAction(testHarness.executor, undefined);
    await turnStartEffect.doAction(testHarness.executor, undefined);

    expect(turnStartEffect.hasExpired()).toBe(false);
    expect(testHarness.stats.actions).toBe(2);
  });
});
