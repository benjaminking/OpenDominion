import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class RoyalBlacksmith extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Royal Blacksmith'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(5);
    await ie.revealHand();
    const coppers: CardCollection = ie.getMatchingCardsInHand(cardNameIs('Copper'));
    if (coppers.size() > 0) {
      await ie.discardCardsFromLocation(coppers, CardLocation.HAND);
    }
  }
}
