import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isACopyOf } from '../../StandardCardEligibilityFunctions';

export class SeaChart extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sea Chart'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    // Looking at the top card leaves it on the deck, so it stays there unless a copy is in play
    const topCard = await ie.lookAtTopCardOfDeck();
    if (topCard !== undefined) {
      // Revealing it fires triggers, so it is only put into hand if it hasn't left the deck since
      const locationExpectation = ie.createLocationExpectation(CardLocation.DECK);
      await ie.revealCard(topCard);
      if (ie.hasMatchingCardInPlay(isACopyOf(topCard))) {
        if (!locationExpectation.isMet(topCard)) {
          ie.sendLostTrackMessage(topCard);
          return;
        }
        ie.putCardIntoHandFromLocation(topCard, CardLocation.DECK);
      }
    }
  }
}
