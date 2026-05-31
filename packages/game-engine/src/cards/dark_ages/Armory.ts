import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

export class Armory extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Armory'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain a card costing up to $4 onto your deck')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(4)))
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain, CardLocation.DECK);
    }
  }
}
