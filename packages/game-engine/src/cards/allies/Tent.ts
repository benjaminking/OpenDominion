import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Tent extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tent'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(2);
    ie.rotatePileGroup('Forts');
  }
}
