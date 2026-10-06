import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { costsBetween } from '../../StandardCardEligibilityFunctions';

export class Rogue extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Rogue'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);

    const eligibleTrashCards: CardCollection = ie.getMatchingCardsInTrash(costsBetween(Cost.Simple(3), Cost.Simple(6)));

    if (eligibleTrashCards.size() > 0) {
      const card: Card | Choice = await ie
        .chooseCard('Gain a card from the trash costing between $3 and $6')
        .from(CardLocation.TRASH)
        .to(CardSelectionPurpose.GAIN)
        .choose();
      if (card instanceof Card) {
        await ie.gainCardFromTrash(card);
      }
    } else {
      await ie.performAttack(this, this.attack.bind(this));
    }
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();

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
        await attackedIe.trashCardFromSet(cardToTrash, topCards);
      }
    }

    await attackedIe.discardCardsFromRevealedSet(topCards);
  }
}
