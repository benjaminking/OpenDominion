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
      const otherDiscards: CardCollection = await otherIe
        .chooseCards('You may discard 2 cards to draw a card')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.DISCARD)
        .whereNumCardsIs(either(exactlyNChecked(0), exactlyNChecked(2)))
        .choose();
      if (otherDiscards.size() === 2) {
        await otherIe.discardCardsFromLocation(otherDiscards, CardLocation.HAND);
        await otherIe.drawCards(1);
      }
    });
  }
}
