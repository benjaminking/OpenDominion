import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { LocationExpectation } from '../../game-state/LocationExpectation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { either, isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Rabble extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Rabble'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    const topCards = await ie.takeCardsOffDeck(3);
    const locationExpectation = ie.createLocationExpectation(CardLocation.REVEAL_LIMBO);
    await ie.revealCards(topCards);
    this.dropCardsLostTrackOf(ie, topCards, locationExpectation);

    const cardsToDiscard: CardCollection = topCards.getMatchingCards(either(isActionCard, isTreasureCard));
    await ie.discardCardsFromRevealedSet(cardsToDiscard, topCards);
    // "When you discard" abilities have resolved in between
    this.dropCardsLostTrackOf(ie, topCards, locationExpectation);
    if (topCards.size() > 0) {
      await ie.topDeckCardsFromRevealedSet(topCards);
    }
  }

  private dropCardsLostTrackOf(
    ie: InstructionExecutor,
    cards: CardCollection,
    locationExpectation: LocationExpectation,
  ): void {
    for (const card of cards.asCardArray()) {
      if (!locationExpectation.isMet(card)) {
        ie.sendLostTrackMessage(card);
        cards.removeCard(card);
      }
    }
  }
}
