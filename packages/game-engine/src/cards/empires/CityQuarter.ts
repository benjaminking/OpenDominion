import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class CityQuarter extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('City Quarter'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    await ie.revealHand();
    const numActionCards = ie.numMatchingCardsInHand(isActionCard);
    await ie.drawCards(numActionCards);
  }
}
