import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';
import { Knights } from './Knights';

export class DameAnna extends Knights {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Dame Anna'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Trash up to 2 cards from your hand
    const cardsToTrash: CardCollection = await ie
      .chooseCards('Trash up to 2 cards from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(anyCard)
      .whereNumCardsIs(upToNChecked(2))
      .choose();
    await ie.trashCardsFromLocation(cardsToTrash, CardLocation.HAND);

    await ie.performAttack(this, this.knightAttack.bind(this));
  }
}
