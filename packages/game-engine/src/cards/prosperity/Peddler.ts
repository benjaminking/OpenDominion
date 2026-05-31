import { CardInfoLookup } from '@dominion/card-info';

import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';
import { TurnPhase } from '../../turns/TurnPhase';

export class Peddler extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Peddler'));
  }

  public override adjustCost(cost: Cost, ie: InstructionExecutor): Cost {
    if (ie.getSharedGameState().getTurnPhase() !== TurnPhase.BUY) {
      return cost;
    }
    const reduction = ie.numMatchingCardsPlayedThisTurn(isActionCard) * 2;
    return cost.plus(-reduction);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.addCoins(1);
  }
}
