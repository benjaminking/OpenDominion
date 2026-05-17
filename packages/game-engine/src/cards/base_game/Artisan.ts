import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

export class Artisan extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Artisan'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a card costing up to $5 to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(5)))
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain, CardLocation.HAND);
    }
    const cardToTopdeck = await ie
      .chooseCard('Choose a card to put on top of your deck')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TOPDECK)
      .choose();
    if (cardToTopdeck instanceof Card) {
      await ie.topDeckCardFromLocation(cardToTopdeck, CardLocation.HAND);
    }
  }
}
