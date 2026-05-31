import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

// Shepherd: +1 Action. Discard any number of Victory cards, revealing them. +2 Cards per card discarded.
export class Shepherd extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Shepherd'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    const victoryCards: CardCollection = await ie
      .chooseCards('Discard any number of Victory cards for +2 Cards each')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(isVictoryCard)
      .choose();
    if (victoryCards.size() > 0) {
      await ie.revealCards(victoryCards);
      await ie.discardCardsFromLocation(victoryCards, CardLocation.HAND);
      await ie.drawCards(victoryCards.size() * 2);
    }
  }
}
