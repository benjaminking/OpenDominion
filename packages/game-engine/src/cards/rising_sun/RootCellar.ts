import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class RootCellar extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Root Cellar'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.playRisingSunCardStub('Root Cellar', this);
  }
}
