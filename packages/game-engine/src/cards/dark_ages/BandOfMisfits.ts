import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, isActionCard, isCommandCard, not, costsUpTo } from '../../StandardCardEligibilityFunctions';

export class BandOfMisfits extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Band of Misfits'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const choice: Card | Choice = await ie
      .chooseCard('Choose a non-Command Action card from the Supply costing less than $5 to play')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(both(both(isActionCard, not(isCommandCard)), costsUpTo(this.getCost().plus(-1))))
      .allowNoneOption()
      .choose();

    if (choice instanceof Card) {
      // TODO: playSupplyCardWithoutGaining stub - play a Supply card leaving it there
      await ie.playSupplyCardWithoutGaining(choice);
    }
  }
}
