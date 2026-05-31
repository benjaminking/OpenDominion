import { CardInfo, CardLocation, CardSelectionPurpose, CardType, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../SharedGameState';
import { both, costsAtLeast, costsUpTo } from '../../StandardCardEligibilityFunctions';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';

export abstract class KnightCard extends KingdomCard {
  constructor(sharedGameState: SharedGameState, cardInfo: CardInfo) {
    super(sharedGameState, cardInfo);
  }

  /**
   * Perform the shared knight attack:
   * - Reveal top 2 cards of attacked player's deck
   * - Attacking player may trash one costing $3-$6 from those revealed cards
   * - If a Knight was trashed, trash this attacking Knight
   * - Discard remaining revealed cards
   */
  protected async knightAttack(attackedPlayer: Player, attackingPlayer: Player): Promise<void> {
    const attackedIe: InstructionExecutor = attackedPlayer.getInstructionExecutor();
    const attackingIe: InstructionExecutor = attackingPlayer.getInstructionExecutor();

    const topCards: CardCollection = await attackedIe.takeCardsOffDeck(2);
    await attackedIe.revealCards(topCards);

    const eligible: CardCollection = topCards.getMatchingCards(
      both(costsAtLeast(Cost.Simple(3)), costsUpTo(Cost.Simple(6))),
    );

    if (eligible.size() > 0) {
      const cardToTrash: Card | Choice = await attackingIe
        .chooseCard("Choose a card to trash ($3-$6) from opponent's revealed cards")
        .from(eligible)
        .to(CardSelectionPurpose.TRASH)
        .allowNoneOption()
        .choose();
      if (cardToTrash instanceof Card) {
        const wasKnight = cardToTrash.hasType(CardType.KNIGHT);
        await attackedIe.trashCardFromSet(cardToTrash, topCards);
        if (wasKnight) {
          // If a Knight was trashed, trash this attacking Knight
          await attackingIe.trashCardFromLocation(this, CardLocation.IN_PLAY);
        }
      }
    }

    const toDiscard: CardCollection = topCards.clone();
    await attackedIe.discardCardsFromRevealedSet(toDiscard, topCards);
  }
}
