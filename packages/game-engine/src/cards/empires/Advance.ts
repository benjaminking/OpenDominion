import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isActionCard } from '../../StandardCardEligibilityFunctions';
import { Cost } from '../../card/Cost';

export class Advance extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Advance'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Trash an Action card from hand
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Trash an Action card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(isActionCard)
      .choose();

    if (!(cardToTrash instanceof Card)) {
      return;
    }

    const trashed = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashed === undefined) {
      return;
    }

    // Gain an Action card costing up to $6
    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain an Action card costing up to $6')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(isActionCard)
      .whereCardIs(costsUpTo(Cost.Simple(6)))
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
