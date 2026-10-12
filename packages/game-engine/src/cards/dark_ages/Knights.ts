import { CardInfoLookup } from '@dominion/card-info';
import { CardInfo, CardLocation, CardSelectionPurpose, CardType, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { LocationExpectation } from '../../game-state/LocationExpectation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { costsBetween } from '../../StandardCardEligibilityFunctions';

export abstract class Knights extends KingdomCard {
  constructor(sharedGameState: SharedGameState, cardInfo?: CardInfo) {
    super(sharedGameState, cardInfo ?? CardInfoLookup.lookUpCardInfo('Knights'));
  }

  // selfExpectation is created as the Knight starts being played: once the Knight has left play (e.g. an earlier
  // attack trashed it), it has lost track of itself and can't trash itself again
  protected async performKnightAttack(ie: InstructionExecutor, selfExpectation: LocationExpectation): Promise<void> {
    await ie.performAttack(this, (attackedPlayer: Player, attackingPlayer: Player) =>
      this.knightAttack(attackedPlayer, attackingPlayer, selfExpectation),
    );
  }

  private async knightAttack(
    attackedPlayer: Player,
    attackingPlayer: Player,
    selfExpectation: LocationExpectation,
  ): Promise<void> {
    const attackedIe: InstructionExecutor = attackedPlayer.getInstructionExecutor();
    const attackingIe: InstructionExecutor = attackingPlayer.getInstructionExecutor();

    const topCards: CardCollection = await attackedIe.takeCardsOffDeck(2);
    const revealedExpectation = attackedIe.createLocationExpectation(CardLocation.REVEAL_LIMBO);
    await attackedIe.revealCards(topCards);

    const eligibleCards: CardCollection = topCards.getMatchingCards(costsBetween(Cost.Simple(3), Cost.Simple(6)));

    if (eligibleCards.size() > 0) {
      const cardToTrash: Card | Choice = await attackedIe
        .chooseCard('Choose a card to trash')
        .from(eligibleCards)
        .to(CardSelectionPurpose.TRASH)
        .choose();
      if (cardToTrash instanceof Card) {
        if (!revealedExpectation.isMet(cardToTrash)) {
          topCards.removeCard(cardToTrash);
          attackedIe.sendLostTrackMessage(cardToTrash);
        } else {
          const trashedCard = await attackedIe.trashCardFromSet(cardToTrash, topCards);
          if (trashedCard instanceof Card && trashedCard.hasType(CardType.KNIGHT)) {
            if (!selfExpectation.isMet(this)) {
              attackingIe.sendLostTrackMessage(this);
            } else {
              await attackingIe.trashCardFromLocation(this, CardLocation.IN_PLAY);
            }
          }
        }
      }
    }

    // Trash triggers may have happened since the cards were revealed
    const lostCards = topCards.getMatchingCards(
      new CardEligibilityFunction((card: Card) => !revealedExpectation.isMet(card)),
    );
    for (const lostCard of lostCards) {
      attackedIe.sendLostTrackMessage(lostCard);
    }
    topCards.removeCards(lostCards);
    await attackedIe.discardCardsFromRevealedSet(topCards);
  }
}
