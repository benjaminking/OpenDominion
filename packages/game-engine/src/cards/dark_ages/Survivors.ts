import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Survivors extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Survivors'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const topCards = await ie.takeCardsOffDeck(2);
    await ie.revealCards(topCards);

    if (topCards.size() === 0) {
      return;
    }

    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Choose any cards to discard (or put them back in any order)')
      .from(topCards)
      .to(CardSelectionPurpose.DISCARD)
      .choose();

    if (cardsToDiscard.size() > 0) {
      await ie.discardCardsFromRevealedSet(cardsToDiscard, topCards);
    }

    await ie.topDeckCardsFromRevealedSet(topCards);
  }
}
