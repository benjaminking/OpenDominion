import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, CardType } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class RiceBroker extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Rice Broker'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    const cardToTrash = await ie
      .chooseCard('Choose a card to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .allowNoneOption()
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }

    const trashedCard = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (!(trashedCard instanceof Card)) {
      return;
    }

    if (trashedCard.hasType(CardType.TREASURE)) {
      await ie.drawCards(2);
    }
    if (trashedCard.hasType(CardType.ACTION)) {
      await ie.drawCards(5);
    }
  }
}
