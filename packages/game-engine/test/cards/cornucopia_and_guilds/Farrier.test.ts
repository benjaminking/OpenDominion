import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Farrier } from '../../../src/cards/cornucopia_and_guilds/Farrier';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Farrier', () => {
  it('gives +1 Card, +1 Action and +1 Buy', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);

    await new Farrier(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([copper]);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.buys).toBe(1);
  });

  it('overpay draws 1 card per $1 overpaid at the end of the turn', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }
    const farrier = new Farrier(testHarness.sharedGameState);
    farrier.setId('farrier-0');
    testHarness.stats.coins = 3;

    testHarness.pickOption('$2');
    const [buyEffect] = testHarness.getCardEffects(farrier, EffectTriggerType.BUY);
    await buyEffect.doAction(testHarness.executor, farrier);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.hand.size()).toBe(0);

    const [turnEndEffect] = testHarness.getAddedEffects(EffectTriggerType.TURN_END);
    expect(turnEndEffect.isMandatory()).toBe(true);
    await turnEndEffect.doAction(testHarness.executor, undefined);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(1);
  });

  it('adds no end-of-turn draw when not overpaying', async () => {
    const testHarness = createCardHarness();
    const farrier = new Farrier(testHarness.sharedGameState);
    farrier.setId('farrier-0');
    testHarness.stats.coins = 3;

    testHarness.pickOption("Don't overpay");
    const [buyEffect] = testHarness.getCardEffects(farrier, EffectTriggerType.BUY);
    await buyEffect.doAction(testHarness.executor, farrier);

    expect(testHarness.stats.coins).toBe(3);
    expect(testHarness.getAddedEffects()).toHaveLength(0);
  });

  it('only draws at the end of the turn it was bought on', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }
    const farrier = new Farrier(testHarness.sharedGameState);
    farrier.setId('farrier-0');
    testHarness.stats.coins = 1;
    const currentTurn = testHarness.turnTracker.getCurrentTurn();
    vi.mocked(testHarness.sharedGameState.getCurrentTurn).mockReturnValue(currentTurn);

    testHarness.pickOption('$1');
    const [buyEffect] = testHarness.getCardEffects(farrier, EffectTriggerType.BUY);
    await buyEffect.doAction(testHarness.executor, farrier);
    const [turnEndEffect] = testHarness.getAddedEffects(EffectTriggerType.TURN_END);
    await turnEndEffect.doAction(testHarness.executor, undefined);
    turnEndEffect.registerEndOfPlayersTurn(testHarness.player, currentTurn);

    const appliesOnNextTurn =
      !turnEndEffect.hasExpired() && turnEndEffect.getTurnEligibility().matches(currentTurn.nextTurn());
    expect(appliesOnNextTurn).toBe(false);
  });
});
