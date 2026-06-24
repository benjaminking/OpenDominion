import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Change extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Change'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    if (ie.getDebt() > 0) {
      await ie.addCoins(3);
      return;
    }

    const cardToTrash = await ie
      .chooseCard('Choose a card to trash')
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

    const cardToGain = await ie
      .chooseCard('Choose a card to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(new CardEligibilityFunction((card: Card) => card.getCost().coins > trashedCard.getCost().coins))
      .allowNoneOption()
      .choose();
    if (!(cardToGain instanceof Card)) {
      return;
    }

    await ie.gainCardFromPile(cardToGain);
    ie.addDebt(cardToGain.getCost().coins - trashedCard.getCost().coins);
  }
}
