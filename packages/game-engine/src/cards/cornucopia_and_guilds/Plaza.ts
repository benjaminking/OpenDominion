import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

// Plaza: +1 Card, +2 Actions; you may discard a Treasure for +1 Coffers.
export class Plaza extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Plaza'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(2);

    // You may discard a Treasure for +1 Coffers
    const treasure: Card | Choice = await ie
      .chooseCard('You may discard a Treasure for +1 Coffers')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();
    if (treasure instanceof Card) {
      await ie.discardCardFromLocation(treasure, CardLocation.HAND);
      // TODO: addCoffers stub
      ie.addCoffers(1);
    }
  }
}
