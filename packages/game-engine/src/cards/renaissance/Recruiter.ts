import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Recruiter extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Recruiter'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);

    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card from your hand to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .allowNoneOption()
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }
    const trashed = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashed !== undefined) {
      ie.addVillagers(trashed.getCost().coins);
    }
  }
}
