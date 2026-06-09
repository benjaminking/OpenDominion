import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class CouncilRoom extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Council Room'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(4);
    ie.addBuys(1);
    await ie.eachOtherPlayer(this.interaction.bind(this));
  }

  public async interaction(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
  }
}
