import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

export class Workshop extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Workshop'));
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
    await ie.gainCardFromPile(cardChoice);
  }
}
