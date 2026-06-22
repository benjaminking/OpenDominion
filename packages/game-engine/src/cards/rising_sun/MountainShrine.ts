import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class MountainShrine extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mountain Shrine'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.playRisingSunCardStub('Mountain Shrine', this);
  }
}
