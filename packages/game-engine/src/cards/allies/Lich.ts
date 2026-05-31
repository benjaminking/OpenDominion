import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Lich extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Lich'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(6);
    ie.addActions(2);
    ie.skipNextTurn();
  }
}
