import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';
import { Cost } from '../../card/Cost';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';

export class Patrician extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Patrician'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const topCard = await ie.lookAtTopCardOfDeck();
    if (topCard !== undefined) {
      await ie.revealCard(topCard);
      if (topCard.getCost().coins >= 5) {
        await ie.putTopCardOfDeckIntoHand();
      }
    }
  }
}
