import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { either, exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Vault extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Vault'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);

    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Choose any number of cards to discard for +$1 each')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    const discardedCards = await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
    await ie.addCoins(discardedCards.size());

    await ie.eachOtherPlayer(async (otherIe: InstructionExecutor) => {
      // A player with only 1 card in hand may discard it, but doesn't draw
      const numToDiscard = Math.min(2, otherIe.handSize());
      const otherDiscards: CardCollection = await otherIe
        .chooseCards('You may discard 2 cards to draw a card')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.DISCARD)
        .whereNumCardsIs(either(exactlyNChecked(0), exactlyNChecked(numToDiscard)))
        .choose();
      if (otherDiscards.size() > 0 && otherDiscards.size() === numToDiscard) {
        await otherIe.discardCardsFromLocation(otherDiscards, CardLocation.HAND);
        if (otherDiscards.size() === 2) {
          await otherIe.drawCards(1);
        }
      }
    });
  }
}
