import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { cardNameIs, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Crossroads extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Crossroads'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.revealHand();
    await ie.drawCards(ie.numMatchingCardsInHand(isVictoryCard));
    if (ie.numMatchingCardsPlayedThisTurn(cardNameIs('Crossroads')) === 1) {
      ie.addActions(3);
    }
  }
}
