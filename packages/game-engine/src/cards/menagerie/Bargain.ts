import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, CardType } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Cost } from '../../card/Cost';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, costsUpTo } from '../../StandardCardEligibilityFunctions';

class IsNotVictoryCard extends CardEligibilityFunction {
  constructor() {
    super((card: Card) => !card.hasType(CardType.VICTORY));
  }
}

const isNotVictoryCard = new IsNotVictoryCard();

export class Bargain extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bargain'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    const choice = await ie
      .chooseCard('Gain a non-Victory card costing up to $5')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(both(costsUpTo(Cost.Simple(5)), isNotVictoryCard))
      .choose();

    if (choice instanceof Card) {
      await ie.gainCardFromPile(choice);
    }

    await ie.eachOtherPlayer(async (otherIe: InstructionExecutor) => {
      await otherIe.gainHorse(1);
    });
  }
}
