import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
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

    const costsThreeToSix = costsBetween(Cost.Simple(3), Cost.Simple(6));
    const eligibleTrashCards: CardCollection = ie.getMatchingCardsInTrash(costsThreeToSix);

    if (eligibleTrashCards.size() > 0) {
      const card: Card | Choice = await ie
        .chooseCard('Gain a card from the trash costing between $3 and $6')
        .from(CardLocation.TRASH)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsThreeToSix)
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
          await attackedIe.trashCardFromSet(cardToTrash, topCards);
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
