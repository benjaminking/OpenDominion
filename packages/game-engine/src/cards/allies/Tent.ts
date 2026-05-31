import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Tent extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tent'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(2);
    ie.rotatePileGroup('Forts');
  }
}
