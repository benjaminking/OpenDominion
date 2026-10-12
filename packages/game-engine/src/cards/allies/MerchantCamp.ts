import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class MerchantCamp extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Merchant Camp'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    ie.addCoins(1);
  }
}
