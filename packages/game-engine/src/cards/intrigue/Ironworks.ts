import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsUpTo, isActionCard, isTreasureCard, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Ironworks extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ironworks'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardChoice: Card | Choice = await ie
      .chooseCard('Choose a card costing up to $4 to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(4)))
      .choose();
    if (!(cardChoice instanceof Card)) {
      return;
    }
    const gainedCard = await ie.gainCardFromPile(cardChoice);
    if (gainedCard === undefined) {
      return;
    }

    if (isActionCard.matches(gainedCard)) {
      ie.addActions(1);
    }
    if (isTreasureCard.matches(gainedCard)) {
      await ie.addCoins(1);
    }
    if (isVictoryCard.matches(gainedCard)) {
      await ie.drawCards(1);
    }
  }
}
