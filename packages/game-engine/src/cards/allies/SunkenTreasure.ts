import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

class NotInPlayByName extends CardEligibilityFunction {
  constructor(private readonly ie: InstructionExecutor) {
    super((card: Card) => {
      const inPlay = ie.getInPlayCards();
      for (const inPlayCard of inPlay) {
        if (inPlayCard.getName() === card.getName()) {
          return false;
        }
      }
      return true;
    });
  }
}

export class SunkenTreasure extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sunken Treasure'));
    this.setCoins(0);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const gainChoice = await ie
      .chooseCard("Gain an Action card you don't have a copy of in play")
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(isActionCard)
      .whereCardIs(new NotInPlayByName(ie))
      .choose();
    if (gainChoice instanceof Card) {
      await ie.gainCardFromPile(gainChoice);
    }
  }
}
