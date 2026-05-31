import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

/**
 * Exploration: At the end of your Buy phase, if you didn't gain any cards
 * during it, +1 Coffers and +1 Villager.
 *
 * Stub: "no cards gained during Buy phase" tracking (hasGainedMatchingCardThisTurn
 * only covers this-turn, not specifically Buy phase) is not yet implemented.
 * Registered as BUY_END trigger but the "no gains" condition is a stub.
 */
export class Exploration extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Exploration'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // stub: "no gains during Buy phase" condition not yet implemented
  }
}
