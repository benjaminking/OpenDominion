import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Mapmaker extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mapmaker'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const revealedCards: CardCollection = await ie.takeCardsOffDeck(4);
    await ie.revealCards(revealedCards);

    if (revealedCards.size() === 0) {
      return;
    }

    const cardsToHand = await ie
      .chooseCards('Choose cards to put into your hand')
      .from(revealedCards)
      .to(CardSelectionPurpose.DRAW)
      .whereNumCardsIs(exactlyNChecked(Math.min(2, revealedCards.size())))
      .choose();

    ie.putCardsIntoHandFromSet(cardsToHand, revealedCards);
    await ie.discardCardsFromLocation(revealedCards, CardLocation.REVEAL_LIMBO);
  }
}
