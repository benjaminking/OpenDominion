import { Card } from '../card/Card';
import { Cost } from '../card/Cost';
import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { anyCard } from '../StandardCardEligibilityFunctions';
import { Turn } from '../turns/Turn';
import { CostChangeFunction } from './CostChangeFunction';
import { noCostChange } from './StandardCostChangeFunctions';
import { AnyTurnEligibility } from './StandardTurnEligibilityFunctions';
import { TurnEligibility } from './TurnEligibility';

export class CostModifier {
  private cardEligibilityFunction: CardEligibilityFunction = anyCard;
  private turnEligibility: TurnEligibility = new AnyTurnEligibility();
  private costChangeFunction: CostChangeFunction = noCostChange;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public apply(card: Card, cardCurrentCost: Cost, turn: Turn) {
    if (!this.cardEligibilityFunction.matches(card) || !this.turnEligibility.matches(turn)) {
      return cardCurrentCost;
    }
    return this.costChangeFunction.apply(cardCurrentCost);
  }

  public isEligibleOnTurn(turn: Turn): boolean {
    return this.turnEligibility.matches(turn);
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

    public build(): CostModifier {
      return this.costModifier;
    }
  };
}
