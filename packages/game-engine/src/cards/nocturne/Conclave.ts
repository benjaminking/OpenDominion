import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardPlayOptions } from '../../CardPlayOptions';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard, isACopyOf } from '../../StandardCardEligibilityFunctions';

// Conclave: +$2. You may play an Action card from your hand that you don't have a copy of in play.
// If you do, +1 Action.
export class Conclave extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Conclave'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    const cardToPlay: Card | Choice = await ie
      .chooseCard('You may play an Action card not already in play')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(isActionCard)
      .allowNoneOption()
      .choose();
    if (cardToPlay instanceof Card) {
      if (!ie.hasMatchingCardInPlay(isACopyOf(cardToPlay))) {
        ie.addActions(1);
        await ie.playCardFromLocation(cardToPlay, CardLocation.HAND);
      }
    }
  }
}
