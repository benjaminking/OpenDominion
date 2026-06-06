import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { either, exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Mill extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mill'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const cardsToDiscard: CardCollection = await ie
      .chooseCards('You may discard 2 cards for +$2')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(either(exactlyNChecked(2), exactlyNChecked(0)))
      .choose();
    if (cardsToDiscard.size() >= 2) {
      await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
      await ie.addCoins(2);
    }
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 1;
  }
}
