import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Moneylender extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Moneylender'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardChoice: Card | Choice = await ie
      .chooseCard('You may trash a Copper')
      .from(CardLocation.HAND)
      .whereCardIs(cardNameIs('copper'))
      .to(CardSelectionPurpose.TRASH)
      .allowNoneOption()
      .choose();
    if (!(cardChoice instanceof Card)) {
      return;
    }
    const trashedCard: Card | undefined = await ie.trashCardFromLocation(cardChoice, CardLocation.HAND);
    if (trashedCard !== undefined) {
      await ie.addCoins(3);
    }
  }
}
