import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Trade extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Trade'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Trash up to 2 cards from your hand. Gain a Silver per card you trashed.
    const cardsToTrash: CardCollection = await ie
      .chooseCards('Trash up to 2 cards from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(upToNChecked(2))
      .choose();
    const trashed = await ie.trashCardsFromLocation(cardsToTrash, CardLocation.HAND);
    for (let i = 0; i < trashed.size(); i++) {
      await ie.gainCardFromPile('Silver');
    }
  }
}
