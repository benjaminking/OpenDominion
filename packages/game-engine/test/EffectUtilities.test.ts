import { describe, expect, it, vi } from 'vitest';

import { Card } from '../src/card/Card';
import { Cost } from '../src/card/Cost';
import { CardEligibilityFunction } from '../src/CardEligibilityFunction';
import { CostChangeFunction } from '../src/effects/CostChangeFunction';
import { CostModifier } from '../src/effects/CostModifier';
import { CoinCostReduction, noCostChange } from '../src/effects/StandardCostChangeFunctions';
import {
  AnyTurnEligibility,
  NextTurnEligibility,
  ThisTurnEligibility,
} from '../src/effects/StandardTurnEligibilityFunctions';
import { Player } from '../src/players/Player';
import { SharedGameState } from '../src/game-state/SharedGameState';
import { Turn } from '../src/turns/Turn';

const createPlayer = (name: string, unofficialTurnNumber = 0): Player => {
  return {
    getName: vi.fn(() => name),
    getStatistics: vi.fn(() => ({
      getUnofficialTurnNumber: vi.fn(() => unofficialTurnNumber),
    })),
  } as unknown as Player;
};

describe('effect utility modules', () => {
  it('should delegate CostChangeFunction.apply to the wrapped implementation', () => {
    const internalFunction = vi.fn((currentCost: Cost) => currentCost.plus(2));
    class TestCostChangeFunction extends CostChangeFunction {}
    const costChangeFunction = new TestCostChangeFunction(internalFunction);
    const startingCost = Cost.Simple(4);

    const changedCost = costChangeFunction.apply(startingCost);

    expect(changedCost.toCommonCost()).toEqual(Cost.Simple(6).toCommonCost());
    expect(internalFunction).toHaveBeenCalledWith(startingCost);
  });

  it('should expose standard identity and coin-reduction cost change functions', () => {
    const startingCost = Cost.Simple(5);

    expect(noCostChange.apply(startingCost)).toBe(startingCost);
    expect(new CoinCostReduction(2).apply(startingCost).toCommonCost()).toEqual(Cost.Simple(3).toCommonCost());
    expect(new CoinCostReduction(8).apply(Cost.Simple(3)).toCommonCost()).toEqual(Cost.Simple(0).toCommonCost());
  });

  it('should only apply a CostModifier when both the card and turn are eligible', () => {
    const eligibleCard = { getId: vi.fn(() => 'eligible-card') } as unknown as Card;
    const otherCard = { getId: vi.fn(() => 'other-card') } as unknown as Card;
    const eligibleTurn = new Turn(createPlayer('Alice'), 1, 2);
    const ineligibleTurn = new Turn(createPlayer('Alice'), 1, 1);
    const cardEligibility = new CardEligibilityFunction((card: Card) => card === eligibleCard);
    const modifier = new CostModifier.Builder()
      .setCardEligibility(cardEligibility)
      .setTurnEligibility({
        matches: vi.fn((turn: Turn) => turn.getUnofficialNumber() === 2),
      })
      .setCostChangeFunction(new CoinCostReduction(3))
      .build();
    const startingCost = Cost.Simple(7);

    expect(modifier.apply(eligibleCard, startingCost, eligibleTurn).toCommonCost()).toEqual(
      Cost.Simple(4).toCommonCost(),
    );
    expect(modifier.apply(otherCard, startingCost, eligibleTurn)).toBe(startingCost);
    expect(modifier.apply(eligibleCard, startingCost, ineligibleTurn)).toBe(startingCost);
    expect(modifier.isEligibleOnTurn(eligibleTurn)).toBe(true);
    expect(modifier.isEligibleOnTurn(ineligibleTurn)).toBe(false);
  });

  it('should match only the captured player and unofficial turn for standard turn eligibility functions', () => {
    const currentPlayer = createPlayer('Alice', 4);
    const gameState = {
      getCurrentPlayer: vi.fn(() => currentPlayer),
    } as unknown as SharedGameState;

    const thisTurnEligibility = new ThisTurnEligibility(gameState);
    const nextTurnEligibility = new NextTurnEligibility(gameState);

    expect(thisTurnEligibility.matches(new Turn(createPlayer('Alice'), 12, 4))).toBe(true);
    expect(thisTurnEligibility.matches(new Turn(createPlayer('Bob'), 12, 4))).toBe(false);
    expect(thisTurnEligibility.matches(new Turn(createPlayer('Alice'), 12, 5))).toBe(false);
    expect(nextTurnEligibility.matches(new Turn(createPlayer('Alice'), 12, 5))).toBe(true);
    expect(nextTurnEligibility.matches(new Turn(createPlayer('Alice'), 12, 4))).toBe(false);
    expect(new AnyTurnEligibility().matches()).toBe(true);
  });
});
