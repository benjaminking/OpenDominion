import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class TradingPost extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Trading Post'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardsToTrash: CardCollection = await ie
      .chooseCards('Choose 2 cards to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(exactlyNChecked(2))
      .choose();

    const trashedCards: CardCollection = await ie.trashCardsFromLocation(cardsToTrash, CardLocation.HAND);

    if (trashedCards.size() >= 2) {
      await ie.gainFromPile('silver', CardLocation.HAND);
    }
  }
}
