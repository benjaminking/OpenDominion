import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Footpad } from '../../../src/cards/cornucopia_and_guilds/Footpad';
import { Effect } from '../../../src/effects/Effect';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { TurnPhase } from '../../../src/turns/TurnPhase';
import { CardHarness, createCardHarness } from '../testHarness';

// Applies Footpad's setup rule, registers the resulting global effect with the player,
// and stubs the current turn phase.
const setUpGlobalEffect = (testHarness: CardHarness, turnPhase: TurnPhase): Effect => {
  const addGlobalEffect = vi.fn((_effect: Effect) => undefined);
  Object.assign(testHarness.sharedGameState, { addGlobalEffect, getTurnPhase: () => turnPhase });
  const footpad = new Footpad(testHarness.sharedGameState);
  footpad.setId('footpad-0');

  footpad.getSetupRules().getNextGameStateSetupRule().applySetupRule(testHarness.sharedGameState);

  const globalEffect = addGlobalEffect.mock.calls[0][0];
  vi.mocked(testHarness.player.getEffects().getEffectsByType).mockImplementation((trigger: EffectTriggerType) =>
    trigger === globalEffect.getTrigger() ? [globalEffect] : [],
  );
  return globalEffect;
};

describe('Footpad', () => {
  it('gives +2 Coffers', async () => {
    const testHarness = createCardHarness();

    await new Footpad(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coffers).toBe(2);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('makes each other player discard down to 3 cards in hand', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetHandCards: Copper[] = [];
    for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
      const targetHandCopper = new Copper(targetHarness.sharedGameState);
      targetHandCopper.setId(`copper-target-hand-${String(cardIndex)}`);
      targetHandCards.push(targetHandCopper);
      targetHarness.addToHand(targetHandCopper);
    }
    testHarness.routeAttacksTo(targetHarness);

    targetHarness.pickCards([targetHandCards[0], targetHandCards[1]]);
    await new Footpad(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.hand.size()).toBe(3);
    expect(targetHarness.discard.size()).toBe(2);
  });

  it('in games using it, gaining a card in an Action phase gives +1 Card', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);
    const gainedSilver = new Silver(testHarness.sharedGameState);
    gainedSilver.setId('silver-gained-0');
    testHarness.addToDiscard(gainedSilver);

    const globalEffect = setUpGlobalEffect(testHarness, TurnPhase.ACTION);
    expect(globalEffect.getTrigger()).toBe(EffectTriggerType.GAIN);
    await testHarness.executor.processEffectsByType(
      EffectTriggerType.GAIN,
      new EffectContextBuilder().withTargetCard(gainedSilver).withGainLocation(gainedSilver.getLocation()).build(),
    );

    expect(testHarness.hand.asCardArray()).toEqual([copper]);
  });

  it('does not give +1 Card for gaining a card outside an Action phase', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);
    const gainedSilver = new Silver(testHarness.sharedGameState);
    gainedSilver.setId('silver-gained-0');
    testHarness.addToDiscard(gainedSilver);

    setUpGlobalEffect(testHarness, TurnPhase.BUY);
    await testHarness.executor.processEffectsByType(
      EffectTriggerType.GAIN,
      new EffectContextBuilder().withTargetCard(gainedSilver).withGainLocation(gainedSilver.getLocation()).build(),
    );

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.deck.asCardArray()).toEqual([copper]);
  });
});
