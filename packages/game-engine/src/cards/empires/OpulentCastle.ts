import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class OpulentCastle extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Opulent Castle'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Discard any number of Victory cards from hand; +$2 each
    const victoryCardsInHand = ie.getMatchingCardsInHand(isVictoryCard);
    if (victoryCardsInHand.size() === 0) {
      return;
    }

    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Choose Victory cards from your hand to discard for +$2 each')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(isVictoryCard)
      .choose();

    if (cardsToDiscard.size() > 0) {
      await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
      await ie.addCoins(2 * cardsToDiscard.size());
    }
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 0;
  }
}
