import { ClientGameState } from '@dominion/client-common';
import { CardChoice } from '@dominion/common';

import { ParsedRule } from './ParsedRule';

export class RuleBasedStrategy {
  private rules: ParsedRule[] = [];

  public addRule(rule: ParsedRule): void {
    this.rules.push(rule);
  }

  public getFirstApplicableRule(gameState: ClientGameState, options: CardChoice[]): CardChoice | undefined {
    const optionsByCardName: Map<string, CardChoice> = this.mapCardNamesToOptions(options);

    for (const rule of this.rules) {
      if (!optionsByCardName.has(rule.getName())) {
        continue;
      }
      if (rule.conditionIsSatisfied(gameState)) {
        return optionsByCardName.get(rule.getName());
      }
    }
    return undefined;
  }

  private mapCardNamesToOptions(options: CardChoice[]): Map<string, CardChoice> {
    const optionsByCardName: Map<string, CardChoice> = new Map<string, CardChoice>();
    for (const option of options) {
      optionsByCardName.set(option.card.name, option);
    }
    return optionsByCardName;
  }
}
