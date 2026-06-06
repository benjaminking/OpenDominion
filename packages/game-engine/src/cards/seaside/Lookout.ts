import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Lookout extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Lookout'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const topCards = await ie.takeCardsOffDeck(3);

    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card to trash')
      .from(topCards)
      .to(CardSelectionPurpose.TRASH)
      .choose();
    if (cardToTrash instanceof Card) {
      await ie.trashCardFromSet(cardToTrash, topCards);
    }

    const cardToDiscard: Card | Choice = await ie
      .chooseCard('Choose a card to discard')
      .from(topCards)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    if (cardToDiscard instanceof Card) {
      await ie.discardCardsFromRevealedSet(CardCollection.fromCards([cardToDiscard]), topCards);
    }

    await ie.topDeckCardsFromRevealedSet(topCards);
  }
}
