import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

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
    ie.addActions(1);
    const topCards = await ie.takeCardsOffDeck(3);
    // Trashing and discarding fire triggers, so the other cards are only moved if they haven't moved since
    const locationExpectation = ie.createLocationExpectation(CardLocation.REVEAL_LIMBO);

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
      if (locationExpectation.isMet(cardToDiscard)) {
        await ie.discardCardsFromRevealedSet(CardCollection.fromCards([cardToDiscard]), topCards);
      } else {
        topCards.removeCard(cardToDiscard);
        ie.sendLostTrackMessage(cardToDiscard);
      }
    }

    for (const card of topCards.asCardArray()) {
      if (!locationExpectation.isMet(card)) {
        topCards.removeCard(card);
        ie.sendLostTrackMessage(card);
      }
    }
    await ie.topDeckCardsFromRevealedSet(topCards);
  }
}
