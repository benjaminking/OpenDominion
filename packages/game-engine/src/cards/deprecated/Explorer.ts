import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

// Explorer (Action): You may reveal a Province from your hand.
// If you do, gain a Gold to your hand. If you don't, gain a Silver to your hand.
export class Explorer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Explorer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const hasProvince = ie.hasMatchingCardInHand(cardNameIs('Province'));
    if (hasProvince) {
      let revealed = false;
      await ie
        .chooseOneOption('You may reveal a Province from your hand')
        .from(
          new ActionChoice('Reveal Province (gain Gold to hand)', async () => {
            revealed = true;
          }),
        )
        .from(new ActionChoice('No (gain Silver to hand)'))
        .choose();
      if (revealed) {
        await ie.gainCardFromPile('Gold', CardLocation.HAND);
        return;
      }
    }
    await ie.gainCardFromPile('Silver', CardLocation.HAND);
  }
}
