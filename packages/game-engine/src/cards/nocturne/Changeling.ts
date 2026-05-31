import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Changeling (Night): Trash this. Gain a copy of a card you have in play.
export class Changeling extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Changeling'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
    const cardToCopy: Card | Choice = await ie
      .chooseCard('Choose a card in play to gain a copy of')
      .from(CardLocation.IN_PLAY)
      .to(CardSelectionPurpose.GAIN)
      .allowNoneOption()
      .choose();
    if (cardToCopy instanceof Card) {
      await ie.gainCardFromPile(cardToCopy.getPileName());
    }
  }
}
