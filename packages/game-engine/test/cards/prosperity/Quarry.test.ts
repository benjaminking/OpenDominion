import { describe, expect, it, vi } from 'vitest';

import { Cellar } from '../../../src/cards/base_game/Cellar';
import { Village } from '../../../src/cards/base_game/Village';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Quarry } from '../../../src/cards/prosperity/Quarry';
import { TurnPhase } from '../../../src/turns/TurnPhase';
import { createCardHarness } from '../testHarness';

describe('Quarry', () => {
  it('adds $1 and makes Actions cost $2 less this turn', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');

    await new Quarry(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.sharedGameState.addCostModifier).toHaveBeenCalledTimes(1);
    const costModifier = vi.mocked(testHarness.sharedGameState.addCostModifier).mock.calls[0][0];
    const thisTurn = testHarness.turnTracker.getCurrentTurn();
    expect(costModifier.apply(village, village.getOriginalCost(), thisTurn, TurnPhase.ACTION).coins).toBe(1);
    expect(costModifier.apply(village, village.getOriginalCost(), thisTurn, TurnPhase.BUY).coins).toBe(1);
  });

  it('does not reduce costs below $0', async () => {
    const testHarness = createCardHarness();
    const cellar = new Cellar(testHarness.sharedGameState);
    cellar.setId('cellar-supply-0');

    await new Quarry(testHarness.sharedGameState).play(testHarness.executor);

    const costModifier = vi.mocked(testHarness.sharedGameState.addCostModifier).mock.calls[0][0];
    const cost = costModifier.apply(
      cellar,
      cellar.getOriginalCost(),
      testHarness.turnTracker.getCurrentTurn(),
      TurnPhase.BUY,
    );
    expect(cost.coins).toBe(0);
  });

  it('does not reduce the cost of non-Action cards or apply on later turns', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');

    await new Quarry(testHarness.sharedGameState).play(testHarness.executor);

    const costModifier = vi.mocked(testHarness.sharedGameState.addCostModifier).mock.calls[0][0];
    const thisTurn = testHarness.turnTracker.getCurrentTurn();
    expect(costModifier.apply(silver, silver.getOriginalCost(), thisTurn, TurnPhase.BUY).coins).toBe(3);
    expect(costModifier.apply(village, village.getOriginalCost(), thisTurn.nextTurn(), TurnPhase.BUY).coins).toBe(3);
  });
});
