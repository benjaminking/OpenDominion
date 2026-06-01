import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Invest extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Invest'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    const choice = await ie
      .chooseCard('Exile an Action card from the Supply')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(isActionCard)
      .choose();

    if (choice instanceof Card) {
      await ie.investInActionFromSupply(choice);
    }
  }
}
