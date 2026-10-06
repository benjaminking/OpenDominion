import { CardInfoLookup } from '@dominion/card-info';
import { CardInfo, CardLocation, CardSelectionPurpose, CardType, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { costsBetween } from '../../StandardCardEligibilityFunctions';

export abstract class Knights extends KingdomCard {
  constructor(sharedGameState: SharedGameState, cardInfo?: CardInfo) {
    super(sharedGameState, cardInfo ?? CardInfoLookup.lookUpCardInfo('Knights'));
  }

  protected async knightAttack(attackedPlayer: Player, attackingPlayer: Player): Promise<void> {
    const attackedIe: InstructionExecutor = attackedPlayer.getInstructionExecutor();
    const attackingIe: InstructionExecutor = attackingPlayer.getInstructionExecutor();

    const topCards: CardCollection = await attackedIe.takeCardsOffDeck(2);
    await attackedIe.revealCards(topCards);

    const eligibleCards: CardCollection = topCards.getMatchingCards(costsBetween(Cost.Simple(3), Cost.Simple(6)));

    if (eligibleCards.size() > 0) {
      const cardToTrash: Card | Choice = await attackedIe
        .chooseCard('Choose a card to trash')
        .from(eligibleCards)
        .to(CardSelectionPurpose.TRASH)
        .choose();
      if (cardToTrash instanceof Card) {
        const trashedCard = await attackedIe.trashCardFromSet(cardToTrash, topCards);
        if (trashedCard instanceof Card && trashedCard.hasType(CardType.KNIGHT)) {
          await attackingIe.trashCardFromLocation(this, CardLocation.IN_PLAY);
        }
      }
    }

    await attackedIe.discardCardsFromRevealedSet(topCards);
  }
}
