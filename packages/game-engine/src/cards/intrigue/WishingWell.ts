import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class WishingWell extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wishing Well'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const cardGuess = await ie
      .chooseCard('Guess what your top card is.')
      .from(CardSelectionLocation.ALL_CARDS)
      .to(CardSelectionPurpose.DRAW)
      .choose();

    const topCard = await ie.lookAtTopCardOfDeck();

    if (topCard instanceof Card) {
      await ie.revealCard(topCard);
      if (cardGuess instanceof Card && cardGuess.equals(topCard)) {
        await ie.putTopCardOfDeckIntoHand();
      }
    }
  }
}
