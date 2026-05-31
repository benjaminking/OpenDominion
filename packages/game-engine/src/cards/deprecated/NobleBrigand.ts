import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard, cardNameIs } from '../../StandardCardEligibilityFunctions';

const isSilverOrGold = new CardEligibilityFunction(
  (c: Card) => cardNameIs('Silver').matches(c) || cardNameIs('Gold').matches(c),
);

// Noble Brigand (Action/Attack): +$1. Each other player reveals the top 2 cards of their deck.
// If they revealed a Silver or Gold, they trash one such card you choose; you gain it.
// They discard the other revealed cards. If they revealed no Treasure, they gain a Copper.
export class NobleBrigand extends KingdomCard {
  private gainedCards: CardCollection = new CardCollection();

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Noble Brigand'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    this.gainedCards = new CardCollection();
    await ie.performAttack(this, this.attack.bind(this, ie));
    for (const card of this.gainedCards) {
      await ie.gainCardFromTrash(card);
    }
  }

  private async attack(
    brigandIe: InstructionExecutor,
    attackedPlayer: Player,
    _attackingPlayer: Player,
  ): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    const revealed = await attackedIe.takeCardsOffDeck(2);
    await attackedIe.revealCards(revealed);

    const silverOrGolds = revealed.getMatchingCards(isSilverOrGold);
    const rest = revealed.getMatchingCards(new CardEligibilityFunction((c: Card) => !isSilverOrGold.matches(c)));

    if (silverOrGolds.size() === 0) {
      await attackedIe.discardCards(revealed, CardLocation.REVEAL_LIMBO);
      await attackedIe.gainCardFromPile('Copper');
      return;
    }

    let cardToTrash: Card | undefined;
    if (silverOrGolds.size() === 1) {
      cardToTrash = silverOrGolds.getArbitraryCard();
    } else {
      const chosen: Card | Choice = await brigandIe
        .chooseCard('Choose a Silver or Gold to trash')
        .from(silverOrGolds)
        .to(CardSelectionPurpose.TRASH)
        .choose();
      if (chosen instanceof Card) {
        cardToTrash = chosen;
      }
    }

    if (cardToTrash !== undefined) {
      await attackedIe.trashCardFromSet(cardToTrash, revealed);
      this.gainedCards.addCard(cardToTrash);
    }

    await attackedIe.discardCards(revealed, CardLocation.REVEAL_LIMBO);
  }
}
