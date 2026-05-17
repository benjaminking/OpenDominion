import { ClientGameState } from '@dominion/client-common';

import { Condition, TrueCondition } from './Conditions';

export class ParsedRule {
  private cardName: string;
  private condition: Condition;

  private constructor(cardName: string, condition: Condition) {
    this.cardName = cardName;
    this.condition = condition;
  }

  public static unconditionalRule(cardName: string): ParsedRule {
    return new ParsedRule(cardName, new TrueCondition());
  }

  public static conditionalRule(cardName: string, condition: Condition): ParsedRule {
    return new ParsedRule(cardName, condition);
  }

  public getName(): string {
    return this.cardName;
  }

  public conditionIsSatisfied(gameState: ClientGameState): boolean {
    return this.condition.matches(gameState);
  }
}
