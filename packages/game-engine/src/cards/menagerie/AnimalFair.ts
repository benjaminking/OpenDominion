import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class AnimalFair extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Animal Fair'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(4);
    ie.addBuys(ie.getNumEmptySupplyPiles());
  }
}
