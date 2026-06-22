import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsUpToNMoreThanCard } from '../../StandardCardEligibilityFunctions';

export class Butcher extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Butcher'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoffers(2);

    const cardToTrash: Card | Choice = await ie
      .chooseCard('You may trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .allowNoneOption()
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }
    const trashedCard = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (!(trashedCard instanceof Card)) {
      return;
    }
    
    const numCoffersSpent = await ie.chooseCoffers();
    ie.removeCoffers(numCoffersSpent);

    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain a card costing up to $' + numCoffersSpent.toFixed() + ' more to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpToNMoreThanCard(trashedCard, numCoffersSpent))
      .allowNoneOption()
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
