import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Nomad Camp (Action): +1 Buy, +$2. (This is gained onto your deck.)
// On-gain to-deck effect not implemented here.
export class NomadCamp extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Nomad Camp'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.addCoins(2);
    // TODO: When gained, this is put onto your deck instead of discard (on-gain effect not implemented)
  }
}
