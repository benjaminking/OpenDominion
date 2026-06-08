import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class WishingWell extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wishing Well'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const cardGuess = await ie.nameCard(CardSelectionPurpose.DRAW);

    const topCard = await ie.lookAtTopCardOfDeck();

    if (topCard instanceof Card) {
      await ie.revealCard(topCard);
      if (cardGuess instanceof Card && cardGuess.equals(topCard)) {
        await ie.putTopCardOfDeckIntoHand();
      }
    }
  }
}
