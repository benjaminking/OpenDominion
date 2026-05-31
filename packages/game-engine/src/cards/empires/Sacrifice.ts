import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard, isTreasureCard, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Sacrifice extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sacrifice'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card from your hand to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }
    const trashedCard = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashedCard === undefined) {
      return;
    }
    if (isActionCard.matches(trashedCard)) {
      await ie.drawCards(2);
      ie.addActions(2);
    }
    if (isTreasureCard.matches(trashedCard)) {
      await ie.addCoins(2);
    }
    if (isVictoryCard.matches(trashedCard)) {
      ie.addVP(2);
    }
  }
}
