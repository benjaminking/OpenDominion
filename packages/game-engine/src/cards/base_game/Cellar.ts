import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Cellar extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cellar'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    const cards: CardCollection = await ie
      .chooseCards('Choose any number of cards to discard')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    await ie.discardCardsFromLocation(cards, CardLocation.HAND);
    await ie.drawCards(cards.size());
  }
}
