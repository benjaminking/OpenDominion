import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Baron extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Baron'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    const cardChoice: Card | Choice = await ie
      .chooseCard('You may discard an Estate for +$4')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(cardNameIs('estate'))
      .allowNoneOption()
      .choose();
    if (cardChoice instanceof Card) {
      const discardedCard: Card | undefined = await ie.discardCardFromLocation(cardChoice, CardLocation.HAND);
      if (discardedCard !== undefined) {
        await ie.addCoins(4);
      }
    } else {
      await ie.gainFromPile('estate');
    }
  }
}
