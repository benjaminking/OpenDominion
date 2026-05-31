import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class SaltTheEarth extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Salt the Earth'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    ie.addVP(1);
    // Trash a Victory card from the Supply
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Trash a Victory card from the Supply')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(isVictoryCard)
      .choose();
    if (cardToTrash instanceof Card) {
      await ie.trashCardFromLocation(cardToTrash, CardLocation.PILE);
    }
  }
}

