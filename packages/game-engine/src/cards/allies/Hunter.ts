import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard, isTreasureCard, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Hunter extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Hunter'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    const revealed = await ie.takeCardsOffDeck(3);
    await ie.revealCards(revealed);

    const toHand = new CardCollection();
    const actions = revealed.getMatchingCards(isActionCard);
    const treasures = revealed.getMatchingCards(isTreasureCard);
    const victories = revealed.getMatchingCards(isVictoryCard);

    if (!actions.isEmpty()) {
      const card = actions.getArbitraryCard();
      revealed.removeCard(card);
      toHand.addCard(card);
    }
    if (!treasures.isEmpty()) {
      const card = treasures.getArbitraryCard();
      revealed.removeCard(card);
      toHand.addCard(card);
    }
    if (!victories.isEmpty()) {
      const card = victories.getArbitraryCard();
      revealed.removeCard(card);
      toHand.addCard(card);
    }

    if (!toHand.isEmpty()) {
      ie.putCardsIntoHandFromSet(toHand, revealed);
    }
    await ie.discardCardsFromLocation(revealed, CardLocation.REVEAL_LIMBO);
  }
}
