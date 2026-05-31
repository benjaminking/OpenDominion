import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Sentinel extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sentinel'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const revealed = await ie.takeCardsOffDeck(5);
    await ie.revealCards(revealed);

    const toTrash = await ie
      .chooseCards('You may trash up to 2 of them')
      .from(revealed)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(upToNChecked(2))
      .choose();

    if (!toTrash.isEmpty()) {
      await ie.trashCardsFromSet(toTrash, revealed);
    }

    while (!revealed.isEmpty()) {
      await ie.topDeckCardsFromRevealedSet(revealed);
    }
  }
}
