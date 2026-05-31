import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Coppersmith (Action): Copper produces an extra $1 this turn.
export class Coppersmith extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Coppersmith'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCopperValueBonus(1);
    // TODO: addCopperValueBonus is a stub — Copper bonus not yet fully implemented
  }
}
