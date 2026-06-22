import { GameInitializer } from './GameInitializer';
import { GameInitializationSetupRule, SetupRuleType } from './SetupRule';

export class PileReplacingSetupRule implements GameInitializationSetupRule {
  public constructor(
    private readonly cardName: string,
    private readonly replacementCardName: string,
  ) { }

  public setupRuleType: SetupRuleType.GAME_INITIALIZATION = SetupRuleType.GAME_INITIALIZATION;

  public applySetupRule(gameInitializer: GameInitializer): void {
    gameInitializer.replaceCardsInPiles(this.cardName, this.replacementCardName);
  }
}
