import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, costsUpTo } from '../../StandardCardEligibilityFunctions';

export class Smugglers extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Smugglers'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardChoice: Card | Choice = await ie
      .chooseCard('Choose a card to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(
        both(costsUpTo(Cost.Simple(6)), ie.createPlayerToTheLeftGainedOnTheirLastTurnCardEligibilityFunction()),
      )
      .choose();
    if (!(cardChoice instanceof Card)) {
      return;
    }
    await ie.gainCardFromPile(cardChoice);
  }
}
