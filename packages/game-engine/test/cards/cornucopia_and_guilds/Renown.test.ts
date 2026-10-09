import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Renown } from '../../../src/cards/cornucopia_and_guilds/Renown';
import { TurnPhase } from '../../../src/turns/TurnPhase';
import { createCardHarness } from '../testHarness';

describe('Renown', () => {
  it('gives +1 Buy and makes cards cost $2 less this turn, but not below $0', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-supply-0');

    await new Renown(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.sharedGameState.addCostModifier).toHaveBeenCalledTimes(1);
    const costModifier = vi.mocked(testHarness.sharedGameState.addCostModifier).mock.calls[0][0];
    const thisTurn = testHarness.turnTracker.getCurrentTurn();
    expect(costModifier.apply(gold, gold.getOriginalCost(), thisTurn, TurnPhase.BUY).coins).toBe(4);
    expect(costModifier.apply(copper, copper.getOriginalCost(), thisTurn, TurnPhase.BUY).coins).toBe(0);
  });

  it('does not reduce costs on a later turn', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');

    await new Renown(testHarness.sharedGameState).play(testHarness.executor);

    const costModifier = vi.mocked(testHarness.sharedGameState.addCostModifier).mock.calls[0][0];
    const nextTurn = testHarness.turnTracker.getCurrentTurn().nextTurn();
    expect(costModifier.apply(gold, gold.getOriginalCost(), nextTurn, TurnPhase.BUY).coins).toBe(6);
  });
});
