import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { LocationExpectation } from '../../game-state/LocationExpectation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Bandit extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bandit'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Gold');
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    const thiefEligibleCards = new CardCollection();
    const thiefNonTreasureCards = new CardCollection();
    const cards = await ie.takeCardsOffDeck(2);
    // Revealing and trashing fire triggers before the cards are moved
    const locationExpectation = ie.createLocationExpectation(CardLocation.REVEAL_LIMBO);
    await ie.revealCards(cards);

    for (const card of cards) {
      if (isTreasureCard.matches(card) && card.getName() !== 'Copper') {
        thiefEligibleCards.addCard(card);
      } else thiefNonTreasureCards.addCard(card);
    }

    // The revealed cards are moved out of the reveal zone, so none of them is left behind there as well
    if (thiefEligibleCards.size() === 1) {
      await this.trashIfTracked(ie, thiefEligibleCards.getArbitraryCard(), locationExpectation);
      await this.discardTrackedCards(ie, thiefNonTreasureCards, locationExpectation);
    } else if (thiefEligibleCards.size() === 2) {
      const cardChoice: Card | Choice = await ie
        .chooseCard('Choose a card to trash')
        .from(thiefEligibleCards)
        .to(CardSelectionPurpose.TRASH)
        .choose();
      if (cardChoice instanceof Card) {
        thiefEligibleCards.removeCard(cardChoice);
        await this.trashIfTracked(ie, cardChoice, locationExpectation);
      }
      await this.discardTrackedCards(ie, thiefEligibleCards, locationExpectation);
    } else {
      await this.discardTrackedCards(ie, thiefNonTreasureCards, locationExpectation);
    }
  }

  private async trashIfTracked(
    ie: InstructionExecutor,
    card: Card,
    locationExpectation: LocationExpectation,
  ): Promise<void> {
    if (!locationExpectation.isMet(card)) {
      ie.sendLostTrackMessage(card);
      return;
    }
    await ie.trashCardFromLocation(card, CardLocation.REVEAL_LIMBO);
  }

  private async discardTrackedCards(
    ie: InstructionExecutor,
    cards: CardCollection,
    locationExpectation: LocationExpectation,
  ): Promise<void> {
    const cardsToDiscard = new CardCollection();
    for (const card of cards) {
      if (locationExpectation.isMet(card)) {
        cardsToDiscard.addCard(card);
      } else {
        ie.sendLostTrackMessage(card);
      }
    }
    await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.REVEAL_LIMBO);
  }
}
