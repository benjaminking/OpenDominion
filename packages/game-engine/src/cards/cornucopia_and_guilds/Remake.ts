import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard,  costsExactlyNMoreThanCard } from '../../StandardCardEligibilityFunctions';

export class Remake extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Remake'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await this.trashAndGain(ie);
    await this.trashAndGain(ie);
  }

  private async trashAndGain(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
        .chooseCard('Trash a card from your hand')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.TRASH)
        .whereCardIs(anyCard)
        .allowNoneOption()
        .choose();
      if (!(cardToTrash instanceof Card)) {
        return
      }
      
      const trashedCard = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
      if (!(trashedCard instanceof Card)) {
        return;
      }

      const cardToGain: Card | Choice = await ie
        .chooseCard('Gain a card costing exactly $' + trashedCard.getCost().plus(1).coins.toFixed())
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsExactlyNMoreThanCard(trashedCard, 1))
        .allowNoneOption()
        .choose();
      if (cardToGain instanceof Card) {
        await ie.gainCardFromPile(cardToGain);
      }
  }
}
