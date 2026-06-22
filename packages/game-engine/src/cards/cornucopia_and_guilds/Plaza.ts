import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Plaza extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Plaza'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(2);

    const treasure: Card | Choice = await ie
      .chooseCard('You may discard a Treasure for +1 Coffers')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();
    if (!(treasure instanceof Card)) {
      return;
    }

    const discardedCard = await ie.discardCardFromLocation(treasure, CardLocation.HAND);
    if(!(discardedCard instanceof Card)) {
      return;
    }
    ie.addCoffers(1);
  }
}
