import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isACopyOf } from '../../StandardCardEligibilityFunctions';

export class SeaChart extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sea Chart'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const topCard = await ie.lookAtTopCardOfDeck();
    if (topCard !== undefined) {
      await ie.revealCard(topCard);
      if (ie.hasMatchingCardInPlay(isACopyOf(topCard))) {
        await ie.putTopCardOfDeckIntoHand();
      } else {
        ie.putCardOnDeck(topCard);
      }
    }
  }
}
