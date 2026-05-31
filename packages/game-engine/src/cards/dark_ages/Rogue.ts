import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { both, costsAtLeast, costsUpTo } from '../../StandardCardEligibilityFunctions';

export class Rogue extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Rogue'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);

    const eligibleTrashCards: CardCollection = ie
      .getSharedGameState()
      .trash.getMatchingCards(both(costsAtLeast(Cost.Simple(3)), costsUpTo(Cost.Simple(6))));

    if (eligibleTrashCards.size() > 0) {
      const card: Card | Choice = await ie
        .chooseCard('Gain a card from the trash costing $3-$6')
        .from(eligibleTrashCards)
        .to(CardSelectionPurpose.GAIN)
        .allowNoneOption()
        .choose();
      if (card instanceof Card) {
        await ie.gainCardFromTrash(card, CardLocation.DISCARD);
      }
    } else {
      await ie.performAttack(this, this.attack.bind(this));
    }
  }

  private async attack(attackedPlayer: Player, attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    const attackingIe = attackingPlayer.getInstructionExecutor();

    const topCards: CardCollection = await attackedIe.takeCardsOffDeck(2);
    await attackedIe.revealCards(topCards);

    const eligible: CardCollection = topCards.getMatchingCards(
      both(costsAtLeast(Cost.Simple(3)), costsUpTo(Cost.Simple(6))),
    );

    if (eligible.size() > 0) {
      const cardToTrash: Card | Choice = await attackingIe
        .chooseCard('Choose a card to trash ($3-$6)')
        .from(eligible)
        .to(CardSelectionPurpose.TRASH)
        .allowNoneOption()
        .choose();
      if (cardToTrash instanceof Card) {
        await attackedIe.trashCardFromSet(cardToTrash, topCards);
      }
    }

    const toDiscard: CardCollection = topCards.clone();
    await attackedIe.discardCardsFromRevealedSet(toDiscard, topCards);
  }
}
