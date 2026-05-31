import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Ranger extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ranger'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    ie.flipJourneyToken();
    if (ie.isJourneyTokenFaceUp()) {
      await ie.drawCards(5);
    }
  }
}
