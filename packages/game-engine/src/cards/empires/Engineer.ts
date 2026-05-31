import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';

export class Engineer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Engineer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
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

    const trashChoice: Card | Choice = await ie
      .chooseCard('You may trash Engineer to gain another card costing up to $4')
      .from(CardLocation.IN_PLAY)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(isTheSameCardAs(this))
      .allowNoneOption()
      .choose();
    if (trashChoice instanceof Card) {
      await ie.trashCardFromLocation(trashChoice, CardLocation.IN_PLAY);
      const secondCard: Card | Choice = await ie
        .chooseCard('Gain a card costing up to $4')
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsUpTo(Cost.Simple(4)))
        .allowNoneOption()
        .choose();
      if (secondCard instanceof Card) {
        await ie.gainCardFromPile(secondCard);
      }
    }
  }
}
