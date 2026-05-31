import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs, either } from '../../StandardCardEligibilityFunctions';

const isCopperOrPotion = either(cardNameIs('Copper'), cardNameIs('Potion'));

export class Apothecary extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Apothecary'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const toTopDeck = new CardCollection();
    for (let i = 0; i < 4; i++) {
      const topCard: Card | undefined = await ie.takeCardOffDeck();
      if (topCard === undefined) {
        break;
      }

      await ie.revealCard(topCard);
      if (isCopperOrPotion.matches(topCard)) {
        ie.putCardIntoHandFromLocation(topCard, CardLocation.REVEAL_LIMBO);
      } else {
        toTopDeck.addCard(topCard);
      }
    }

    if (toTopDeck.size() > 0) {
      await ie.topDeckCardsFromRevealedSet(toTopDeck);
    }
  }
}
