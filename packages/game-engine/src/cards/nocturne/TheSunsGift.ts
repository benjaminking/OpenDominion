import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { Boon } from '../../card/Boon';
import { CardCollection } from '../../card/CardCollection';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class TheSunsGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Sun's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    const topCards = await ie.takeCardsOffDeck(4);
    if (topCards.size() === 0) {
      return;
    }
    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Choose any number of cards to discard')
      .from(topCards)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    await ie.discardCardsFromRevealedSet(cardsToDiscard, topCards);
    await ie.topDeckCardsFromRevealedSet(topCards);
  }
}
