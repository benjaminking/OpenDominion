import { Card } from '../card/Card';
import { Cost } from '../card/Cost';
import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { anyCard } from '../StandardCardEligibilityFunctions';
import { Turn } from '../turns/Turn';
import { TurnPhase } from '../turns/TurnPhase';
import { CostChangeFunction } from './CostChangeFunction';
import { CostChangeTrigger } from './CostChangeTrigger';
import { noCostChange } from './StandardCostChangeFunctions';
import { AnyTurnEligibility } from './StandardTurnEligibilityFunctions';
import { AnyTurnPhaseEligibility } from './StandardTurnPhaseEligibilityFunctions';
import { TurnEligibility } from './TurnEligibility';
import { TurnPhaseEligibility } from './TurnPhaseEligibility';

export class CostModifier {
  private cardEligibilityFunction: CardEligibilityFunction = anyCard;
  private turnEligibility: TurnEligibility = new AnyTurnEligibility();
  private turnPhaseEligibility: TurnPhaseEligibility = new AnyTurnPhaseEligibility();
  private costRecalculationTriggers: CostChangeTrigger[] = [];
  private costChangeFunction: CostChangeFunction = noCostChange;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public apply(card: Card, cardCurrentCost: Cost, turn: Turn, turnPhase: TurnPhase) {
    if (
      !this.cardEligibilityFunction.matches(card) ||
      !this.turnEligibility.matches(turn) ||
      !this.turnPhaseEligibility.matches(turnPhase)
    ) {
      return cardCurrentCost;
    }
    return this.costChangeFunction.apply(cardCurrentCost);
  }

  public isEligibleOnTurn(turn: Turn): boolean {
    return this.turnEligibility.matches(turn);
  }

  public isEligibleOnTurnPhase(turnPhase: TurnPhase): boolean {
    return this.turnPhaseEligibility.matches(turnPhase);
  }

  public getCostRecalculationTriggers(): CostChangeTrigger[] {
    return this.costRecalculationTriggers;
  }

  public static Builder = class {
    costModifier: CostModifier = new CostModifier();

    public setCardEligibility(cardEligibilityFunction: CardEligibilityFunction): this {
      this.costModifier.cardEligibilityFunction = cardEligibilityFunction;
      return this;
    }

    public setTurnEligibility(turnEligibility: TurnEligibility): this {
      this.costModifier.turnEligibility = turnEligibility;
      return this;
    }

    public setCostChangeFunction(costChangeFunction: CostChangeFunction): this {
      this.costModifier.costChangeFunction = costChangeFunction;
      return this;
    }

    public setTurnPhaseEligibility(turnPhaseEligibility: TurnPhaseEligibility): this {
      this.costModifier.turnPhaseEligibility = turnPhaseEligibility;
      return this;
    }

    public recalculateCostsOn(costChangeTrigger: CostChangeTrigger): this {
      this.costModifier.costRecalculationTriggers.push(costChangeTrigger);
      return this;
    }

    public build(): CostModifier {
      return this.costModifier;
    }
  };
}
