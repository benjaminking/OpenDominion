import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Stables extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Stables'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const treasureToDiscard: Card | Choice = await ie
      .chooseCard('You may discard a Treasure for +3 Cards and +1 Action')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();

    if (treasureToDiscard instanceof Card) {
      await ie.discardCardFromLocation(treasureToDiscard, CardLocation.HAND);
      await ie.drawCards(3);
      ie.addActions(1);
    }
  }
}
