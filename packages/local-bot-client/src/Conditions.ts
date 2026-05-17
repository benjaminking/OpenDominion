import { ClientGameState } from '@dominion/client-common';

import { Expression } from './Expressions';

export abstract class Condition {
  public abstract matches(gameState: ClientGameState): boolean;
}

export class TrueCondition extends Condition {
  public matches(_gameState: ClientGameState): boolean {
    return true;
  }
}

export class DisjunctionCondition extends Condition {
  private disjunctions: Condition[];

  public constructor(disjunctions: Condition[]) {
    super();
    this.disjunctions = disjunctions;
  }

  public matches(gameState: ClientGameState): boolean {
    for (const disjunction of this.disjunctions) {
      if (disjunction.matches(gameState)) {
        return true;
      }
    }
    return false;
  }
}

export class ConjunctionCondition extends Condition {
  private conjunctions: Condition[];

  public constructor(conjunctions: Condition[]) {
    super();
    this.conjunctions = conjunctions;
  }

  public matches(gameState: ClientGameState): boolean {
    for (const conjunction of this.conjunctions) {
      if (!conjunction.matches(gameState)) {
        return false;
      }
    }
    return true;
  }
}

export class EqualityCondition extends Condition {
  private leftSide: Expression;
  private rightSide: Expression;

  public constructor(leftSide: Expression, rightSide: Expression) {
    super();
    this.leftSide = leftSide;
    this.rightSide = rightSide;
  }

  public matches(gameState: ClientGameState): boolean {
    return this.leftSide.evaluate(gameState) === this.rightSide.evaluate(gameState);
  }
}

export class LessThanOrEqualCondition extends Condition {
  private leftSide: Expression;
  private rightSide: Expression;

  public constructor(leftSide: Expression, rightSide: Expression) {
    super();
    this.leftSide = leftSide;
    this.rightSide = rightSide;
  }

  public matches(gameState: ClientGameState): boolean {
    return this.leftSide.evaluate(gameState) <= this.rightSide.evaluate(gameState);
  }
}

export class GreaterThanOrEqualCondition extends Condition {
  private leftSide: Expression;
  private rightSide: Expression;

  public constructor(leftSide: Expression, rightSide: Expression) {
    super();
    this.leftSide = leftSide;
    this.rightSide = rightSide;
  }

  public matches(gameState: ClientGameState): boolean {
    return this.leftSide.evaluate(gameState) >= this.rightSide.evaluate(gameState);
  }
}

export class LessThanCondition extends Condition {
  private leftSide: Expression;
  private rightSide: Expression;

  public constructor(leftSide: Expression, rightSide: Expression) {
    super();
    this.leftSide = leftSide;
    this.rightSide = rightSide;
  }

  public matches(gameState: ClientGameState): boolean {
    return this.leftSide.evaluate(gameState) < this.rightSide.evaluate(gameState);
  }
}

export class GreaterThanCondition extends Condition {
  private leftSide: Expression;
  private rightSide: Expression;

  public constructor(leftSide: Expression, rightSide: Expression) {
    super();
    this.leftSide = leftSide;
    this.rightSide = rightSide;
  }

  public matches(gameState: ClientGameState): boolean {
    return this.leftSide.evaluate(gameState) > this.rightSide.evaluate(gameState);
  }
}

export class ActionTokenCondition extends Condition {
  private pileName: string;

  public constructor(pileName: string) {
    super();
    this.pileName = pileName;
  }

  public matches(_gameState: ClientGameState): boolean {
    //return gameState.actionToken === pileName;
    return false;
  }
}

export class CardTokenCondition extends Condition {
  private pileName: string;

  public constructor(pileName: string) {
    super();
    this.pileName = pileName;
  }

  public matches(_gameState: ClientGameState): boolean {
    //return gameState.cardToken === pileName;
    return false;
  }
}
