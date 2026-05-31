import { CardInfoLookup } from '@dominion/card-info';

import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { KnightCard } from './KnightCard';

// Note: Sir Martin costs $4 (not $5 like the other Knights)
export class SirMartin extends KnightCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sir Martin'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(2);
    await ie.performAttack(this, this.knightAttack.bind(this));
  }
}
