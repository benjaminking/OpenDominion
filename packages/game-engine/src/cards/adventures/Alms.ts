import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Alms extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Alms'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Once per turn: If you have no Treasures in play, gain a card costing up to $4
    if (ie.oncePerTurn('Alms')) {
      return;
    }
    if (!ie.hasMatchingCardInPlay(isTreasureCard)) {
      const cardToGain: Card | Choice = await ie
        .chooseCard('Gain a card costing up to $4')
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsUpTo(Cost.Simple(4)))
        .allowNoneOption()
        .choose();
      if (cardToGain instanceof Card) {
        await ie.gainCardFromPile(cardToGain);
      }
    }
  }
}
