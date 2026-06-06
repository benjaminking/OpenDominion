import { SetupRule } from './SetupRule';
import { SharedGameState } from './SharedGameState';

export class CardReplacingSetupRule extends SetupRule {
  public constructor(
    private readonly cardName: string,
    private readonly replacementCardName: string,
  ) {
    super();
  }

  public applySetupRules(sharedGameState: SharedGameState): void {
    sharedGameState.replaceCardsInPiles(this.cardName, this.replacementCardName);
  }
}
