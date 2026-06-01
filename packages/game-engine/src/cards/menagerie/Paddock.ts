import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Paddock extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Paddock'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(2);
    await ie.gainHorse(2);
    ie.addActions(ie.getNumEmptySupplyPiles());
  }
}
