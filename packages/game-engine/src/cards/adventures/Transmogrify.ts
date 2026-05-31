import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Transmogrify extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Transmogrify'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    ie.putCardOnTavernMat(this);
  }
}
