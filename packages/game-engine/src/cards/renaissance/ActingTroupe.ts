import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class ActingTroupe extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Acting Troupe'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addVillagers(4);
    const trashed: Card | Choice = await ie
      .chooseCard('Trash this Acting Troupe')
      .from(CardLocation.IN_PLAY)
      .to(CardSelectionPurpose.TRASH)
      .allowNoneOption()
      .choose();
    if (trashed instanceof Card) {
      await ie.trashCardFromLocation(trashed, CardLocation.IN_PLAY);
    }
  }
}
