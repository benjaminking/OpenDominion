import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, isACopyOf, isActionCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class FirstMate extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('First Mate'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const firstAction: Card | Choice = await ie
      .chooseCard('You may choose an Action card name to play')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(isActionCard)
      .allowNoneOption()
      .choose();

    if (!(firstAction instanceof Card)) {
      await ie.drawUpTo(6);
      return;
    }

    const matchingActions = ie.getMatchingCardsInHand(both(isActionCard, isACopyOf(firstAction)));
    const cardsToPlay = await ie
      .chooseCards('Choose any number of ' + firstAction.getName() + ' cards to play')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(both(isActionCard, isACopyOf(firstAction)))
      .whereNumCardsIs(upToNChecked(matchingActions.size()))
      .choose();

    for (const card of cardsToPlay.asCardArray()) {
      await ie.playCardFromHand(card);
    }

    await ie.drawUpTo(6);
  }
}
