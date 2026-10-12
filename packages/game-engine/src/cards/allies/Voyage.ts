import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { NoThirdConsecutiveTurnPrecondition } from '../../turns/ExtraTurnPreconditions';

export class Voyage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Voyage'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    ie.addExtraTurn(this, [new NoThirdConsecutiveTurnPrecondition()]);
    ie.setMaxCardsFromHandToPlayOnNextTurn(3);
  }
}
