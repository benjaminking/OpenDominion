import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

// Thief (Action/Attack): Each other player reveals the top 2 cards of their deck.
// If they revealed any Treasure cards, they trash one of them that you choose.
// You may gain any or all of these trashed cards. They discard the other revealed cards.
export class Thief extends KingdomCard {
  private trashedCards: CardCollection = new CardCollection();

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Thief'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    this.trashedCards = new CardCollection();
    await ie.performAttack(this, this.attack.bind(this, ie));
    // You may gain any of the trashed cards
    for (const card of this.trashedCards) {
      const choice: Card | Choice = await ie
        .chooseCard(`You may gain ${card.getName()} from the trash`)
        .from(CardLocation.TRASH)
        .to(CardSelectionPurpose.GAIN)
        .allowNoneOption()
        .choose();
      if (choice instanceof Card) {
        await ie.gainCardFromTrash(choice);
      }
    }
  }

  private async attack(thiefIe: InstructionExecutor, attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    const cards = await attackedIe.takeCardsOffDeck(2);
    await attackedIe.revealCards(cards);

    const treasures = cards.getMatchingCards(isTreasureCard);
    const nonTreasures = cards.getMatchingCards(new CardEligibilityFunction((c: Card) => !isTreasureCard.matches(c)));

    if (treasures.size() === 0) {
      await attackedIe.discardCards(cards, CardLocation.REVEAL_LIMBO);
      return;
    }

    let cardToTrash: Card | undefined;
    if (treasures.size() === 1) {
      cardToTrash = treasures.getArbitraryCard();
    } else {
      const chosen: Card | Choice = await thiefIe
        .chooseCard('Choose a Treasure to trash')
        .from(treasures)
        .to(CardSelectionPurpose.TRASH)
        .choose();
      if (chosen instanceof Card) {
        cardToTrash = chosen;
      }
    }

    if (cardToTrash !== undefined) {
      await attackedIe.trashCardFromSet(cardToTrash, treasures);
      this.trashedCards.addCard(cardToTrash);
    }

    // Discard remaining revealed cards
    await attackedIe.discardCards(cards, CardLocation.REVEAL_LIMBO);
  }
}
