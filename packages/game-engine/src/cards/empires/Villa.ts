import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Villa extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Villa'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    ie.addBuys(1);
    await ie.addCoins(1);
    // TODO: when you gain Villa, put it into your hand, +1 Action, and if it's your Buy phase return to Action phase
  }
}
