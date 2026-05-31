import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard, isInLocation } from '../../StandardCardEligibilityFunctions';

// Imp (Action/Spirit): +2 Cards. You may play an Action card from your hand that you
// don't have a copy of in play.
export class Imp extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Imp'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    const cardToPlay: Card | Choice = await ie
      .chooseCard('You may play an Action not already in play')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(
        new CardEligibilityFunction(
          (c: Card) =>
            isActionCard.matches(c) &&
            ie.numMatchingCardsInPlay(
              new CardEligibilityFunction((inPlay: Card) => inPlay.getName() === c.getName()),
            ) === 0,
        ),
      )
      .allowNoneOption()
      .choose();
    if (cardToPlay instanceof Card) {
      await ie.playCardFromLocation(cardToPlay, CardLocation.HAND);
    }
  }
}
