import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';

export class Advisor extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Advisor'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    const topCards: CardCollection = await ie.takeCardsOffDeck(3);
    await ie.revealCards(topCards);

    const leftPlayer: Player = ie.getSharedGameState().getPlayerLeftOfCurrent();
    const leftIe: InstructionExecutor = leftPlayer.getInstructionExecutor();

    const cardToDiscard: Card | Choice = await leftIe
      .chooseCard(
        'Choose a card from ' + ie.getSharedGameState().getCurrentPlayer().getName() + "'s revealed cards to discard",
      )
      .from(topCards)
      .to(CardSelectionPurpose.DISCARD)
      .choose();

    if (cardToDiscard instanceof Card) {
      topCards.removeCard(cardToDiscard);
      await ie.discardCard(cardToDiscard);
    }

    ie.putCardsIntoHandFromSet(topCards, topCards);
  }
}
