import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Envoy: Reveal the top 5 cards of your deck. The player to your left chooses one.
// Discard that one and put the rest into your hand.
export class Envoy extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Envoy'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const topCards = await ie.takeCardsOffDeck(5);
    await ie.revealCards(topCards);
    if (topCards.size() === 0) {
      return;
    }
    let cardToDiscard: Card | undefined;
    await ie.performWithLeftPlayer(async (leftIe: InstructionExecutor) => {
      const chosen: Card | Choice = await leftIe
        .chooseCard('Choose a card for the Envoy player to discard')
        .from(topCards)
        .to(CardSelectionPurpose.DISCARD)
        .choose();
      if (chosen instanceof Card) {
        cardToDiscard = chosen;
      }
    });
    if (cardToDiscard !== undefined) {
      await ie.discardCardsFromRevealedSet(new CardCollection(cardToDiscard), topCards);
    }
    ie.putCardsIntoHandFromSet(topCards, topCards);
  }
}
