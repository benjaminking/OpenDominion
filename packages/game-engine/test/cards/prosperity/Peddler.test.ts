import { describe, expect, it, vi } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Peddler } from '../../../src/cards/prosperity/Peddler';
import { CostModifier } from '../../../src/effects/CostModifier';
import { TurnPhase } from '../../../src/turns/TurnPhase';
import { CardHarness, createCardHarness } from '../testHarness';

const applyPeddlerSetupRule = (testHarness: CardHarness, peddler: Peddler): CostModifier => {
  const setupRules = peddler.getSetupRules();
  expect(setupRules.hasAnyGameStateSetupRules()).toBe(true);
  setupRules.getNextGameStateSetupRule().applySetupRule(testHarness.sharedGameState);
  expect(testHarness.sharedGameState.addCostModifier).toHaveBeenCalledTimes(1);
  return vi.mocked(testHarness.sharedGameState.addCostModifier).mock.calls[0][0];
};

const addActionsToPlay = (testHarness: CardHarness, numActions: number): void => {
  for (let cardIndex = 0; cardIndex < numActions; cardIndex++) {
    const village = new Village(testHarness.sharedGameState);
    village.setId(`village-in-play-${String(cardIndex)}`);
    testHarness.addToInPlay(village);
  }
};

describe('Peddler', () => {
  it('draws 1 card and adds 1 action and $1', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Peddler(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });

  it('costs $2 less per Action card in play during the Buy phase', () => {
    const testHarness = createCardHarness();
    const peddler = new Peddler(testHarness.sharedGameState);
    peddler.setId('peddler-supply-0');
    const costModifier = applyPeddlerSetupRule(testHarness, peddler);
    addActionsToPlay(testHarness, 1);
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-in-play-0');
    testHarness.addToInPlay(smithy);
    // Non-Actions in play don't count
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-in-play-0');
    testHarness.addToInPlay(copper);

    const cost = costModifier.apply(
      peddler,
      peddler.getOriginalCost(),
      testHarness.turnTracker.getCurrentTurn(),
      TurnPhase.BUY,
    );

    expect(peddler.getOriginalCost().coins).toBe(8);
    expect(cost.coins).toBe(4);
  });

  it('does not cost less outside the Buy phase', () => {
    const testHarness = createCardHarness();
    const peddler = new Peddler(testHarness.sharedGameState);
    peddler.setId('peddler-supply-0');
    const costModifier = applyPeddlerSetupRule(testHarness, peddler);
    addActionsToPlay(testHarness, 2);

    const cost = costModifier.apply(
      peddler,
      peddler.getOriginalCost(),
      testHarness.turnTracker.getCurrentTurn(),
      TurnPhase.ACTION,
    );

    expect(cost.coins).toBe(8);
  });

  it('does not cost less than $0', () => {
    const testHarness = createCardHarness();
    const peddler = new Peddler(testHarness.sharedGameState);
    peddler.setId('peddler-supply-0');
    const costModifier = applyPeddlerSetupRule(testHarness, peddler);
    addActionsToPlay(testHarness, 5);

    const cost = costModifier.apply(
      peddler,
      peddler.getOriginalCost(),
      testHarness.turnTracker.getCurrentTurn(),
      TurnPhase.BUY,
    );

    expect(cost.coins).toBe(0);
  });

  it('only reduces the cost of Peddler', () => {
    const testHarness = createCardHarness();
    const peddler = new Peddler(testHarness.sharedGameState);
    peddler.setId('peddler-supply-0');
    const costModifier = applyPeddlerSetupRule(testHarness, peddler);
    addActionsToPlay(testHarness, 2);
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');

    const cost = costModifier.apply(
      smithy,
      smithy.getOriginalCost(),
      testHarness.turnTracker.getCurrentTurn(),
      TurnPhase.BUY,
    );

    expect(cost.coins).toBe(4);
  });
});
