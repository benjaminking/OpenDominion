import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { GameStateSetupRule, SetupRuleType } from '../../setup/SetupRule';

class ExtraCofferSetupRule implements GameStateSetupRule {
  public setupRuleType: SetupRuleType.GAME_STATE = SetupRuleType.GAME_STATE;
  public applySetupRule(sharedGameState: SharedGameState): void {
    for(const player of sharedGameState.getCurrentTurnOrder()) {
      player.getInstructionExecutor().addCoffers(1);
    }
  }
  
}

export class Baker extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Baker'));
    this.addSetupRule(new ExtraCofferSetupRule())
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    ie.addCoffers(1);
  }
}
