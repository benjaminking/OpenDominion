import * as strategies from './PredefinedStrategies';
import { RuleBasedBot } from './RuleBasedBot';
import { RuleSet } from './RuleSet';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BotFactory {
  public static createRuleBasedBot(predefinedStrategyName: string): RuleBasedBot {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const predefinedStrategy: RuleSet = (strategies as any)[predefinedStrategyName] as RuleSet;
    return new RuleBasedBot(predefinedStrategy);
  }
}
