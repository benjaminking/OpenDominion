import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, CardType } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

class IsNotVictoryCard extends CardEligibilityFunction {
  constructor() {
    super((card: Card) => !card.hasType(CardType.VICTORY));
  }
}

const isNotVictoryCard = new IsNotVictoryCard();

export class CamelTrain extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Camel Train'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const choice = await ie
      .chooseCard('Exile a non-Victory card from the Supply')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(isNotVictoryCard)
      .choose();

    if (choice instanceof Card) {
      await ie.exileFromSupply(choice);
    }
  }
}
