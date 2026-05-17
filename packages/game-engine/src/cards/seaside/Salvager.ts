import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Salvager extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Salvager'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();

    if (!(cardToTrash instanceof Card)) {
      return;
    }

    const trashedCard: Card | undefined = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashedCard !== undefined) {
      await ie.addCoins(trashedCard.getCost().coins);
    }
  }
}
