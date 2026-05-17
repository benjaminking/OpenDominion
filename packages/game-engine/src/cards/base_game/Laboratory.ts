import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Laboratory extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Laboratory'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    ie.addActions(1);
  }
}
