import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Sextant extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sextant'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(3);
    ie.addBuys(1);

    const revealedCards: CardCollection = await ie.takeCardsOffDeck(5);
    await ie.revealCards(revealedCards);

    const cardsToDiscard = await ie
      .chooseCards('Choose any number of cards to discard')
      .from(revealedCards)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(upToNChecked(revealedCards.size()))
      .choose();
    await ie.discardCardsFromRevealedSet(cardsToDiscard, revealedCards);

    if (revealedCards.size() > 0) {
      await ie.topDeckCardsFromRevealedSet(revealedCards);
    }
  }
}
