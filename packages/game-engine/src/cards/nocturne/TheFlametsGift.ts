import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Boon } from '../../card/Boon';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class TheFlametsGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Flame's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
      .chooseCard('You may trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .allowNoneOption()
      .choose();
    if (cardToTrash instanceof Card) {
      await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    }
  }
}
