import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Temple extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Temple'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addVP(1);
    // Trash 1–3 differently named cards from hand
    const cardsToTrash: CardCollection = await ie
      .chooseCards('Trash 1 to 3 differently named cards from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(upToNChecked(3))
      .choose();

    if (cardsToTrash.size() >= 1) {
      await ie.trashCardsFromLocation(cardsToTrash, CardLocation.HAND);
      // Add 1 VP to the Temple pile
      ie.addPileVPTokens('Temple', 1);
    }
  }
}
