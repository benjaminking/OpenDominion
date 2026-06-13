import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Cartographer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cartographer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const topCards = await ie.takeCardsOffDeck(4);
    await ie.revealCards(topCards);

    const toDiscard: CardCollection = await ie
      .chooseCards('Choose any number of cards to discard')
      .from(topCards)
      .to(CardSelectionPurpose.DISCARD)
      .choose();

    await ie.discardCardsFromRevealedSet(toDiscard, topCards);
    if (topCards.size() > 0) {
      await ie.topDeckCardsFromRevealedSet(topCards);
    }
  }
}
