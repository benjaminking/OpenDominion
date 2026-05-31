import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Sculptor extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sculptor'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a card costing up to $4 to gain to your hand')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(4)))
      .choose();
    if (!(cardToGain instanceof Card)) {
      return;
    }
    const gained = await ie.gainCardFromPile(cardToGain, CardLocation.HAND);
    if (gained !== undefined && isTreasureCard.matches(gained)) {
      ie.addVillagers(1);
    }
  }
}
