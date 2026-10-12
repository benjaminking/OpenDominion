import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsUpTo, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Alms extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Alms'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    if (ie.hasEventBeenBoughtMultipleTimesThisTurn(this)) {
      return;
    }
    
    if (!ie.hasMatchingCardInPlay(isTreasureCard)) {
      const cardToGain: Card | Choice = await ie
        .chooseCard('Gain a card costing up to $4')
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsUpTo(Cost.Simple(4)))
        .choose();
      if (cardToGain instanceof Card) {
        await ie.gainCardFromPile(cardToGain);
      }
    }
  }
}
