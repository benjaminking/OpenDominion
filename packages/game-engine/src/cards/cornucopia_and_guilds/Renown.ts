import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Renown (Reward): +1 Buy; cards cost $2 less this turn.
// Note: applyGlobalCostReduction() is a stub.
export class Renown extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Renown'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    // TODO: applyGlobalCostReduction stub — cost reduction not yet implemented
    ie.applyGlobalCostReduction(2);
  }
}
