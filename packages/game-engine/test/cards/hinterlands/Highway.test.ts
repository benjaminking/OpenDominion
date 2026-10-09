import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Highway } from '../../../src/cards/hinterlands/Highway';
import { TurnPhase } from '../../../src/turns/TurnPhase';
import { createCardHarness } from '../testHarness';

describe('Highway', () => {
  it('draws 1 card and adds 1 action', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 2; i++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(i)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Highway(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('makes cards cost $1 less this turn, but not below $0', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-supply-0');

    await new Highway(testHarness.sharedGameState).play(testHarness.executor);

    const [[costModifier]] = vi.mocked(testHarness.sharedGameState.addCostModifier).mock.calls;
    const thisTurn = testHarness.turnTracker.getCurrentTurn();
    expect(costModifier.apply(gold, gold.getOriginalCost(), thisTurn, TurnPhase.BUY).coins).toBe(5);
    expect(costModifier.apply(gold, gold.getOriginalCost(), thisTurn, TurnPhase.ACTION).coins).toBe(5);
    expect(costModifier.apply(copper, copper.getOriginalCost(), thisTurn, TurnPhase.BUY).coins).toBe(0);
  });

  it('does not reduce costs on a later turn', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');

    await new Highway(testHarness.sharedGameState).play(testHarness.executor);

    const [[costModifier]] = vi.mocked(testHarness.sharedGameState.addCostModifier).mock.calls;
    const nextTurn = testHarness.turnTracker.getCurrentTurn().nextTurn();
    expect(costModifier.apply(gold, gold.getOriginalCost(), nextTurn, TurnPhase.BUY).coins).toBe(6);
  });
});
