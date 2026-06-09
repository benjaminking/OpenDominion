import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Sentry extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sentry'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const topCards = await ie.takeCardsOffDeck(2);
    await ie.revealCards(topCards);

    if (topCards.size() > 0) {
      const cardsToTrash: CardCollection = await ie
        .chooseCards('Choose any number of cards to trash')
        .from(topCards)
        .to(CardSelectionPurpose.TRASH)
        .choose();
      await ie.trashCardsFromSet(cardsToTrash, topCards);
    }

    if (topCards.size() > 0) {
      const cardsToDiscard: CardCollection = await ie
        .chooseCards('Choose any number of cards to discard')
        .from(topCards)
        .to(CardSelectionPurpose.DISCARD)
        .choose();
      await ie.discardCardsFromRevealedSet(cardsToDiscard, topCards);
      await ie.topDeckCardsFromRevealedSet(topCards);
    }
  }
}
