import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

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
