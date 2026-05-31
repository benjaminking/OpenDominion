import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

// Saboteur (Action/Attack): Each other player reveals cards from the top of their deck
// until revealing one costing $3 or more. They trash that card, then may gain one costing
// up to $2 less than it. They discard the other revealed cards.
export class Saboteur extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Saboteur'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    const discardPile = new CardCollection();
    let targetCard: Card | undefined;
    while (targetCard === undefined) {
      const card = await attackedIe.takeCardOffDeck();
      if (card === undefined) {
        break;
      }
      if (card.getCost().coins >= 3) {
        targetCard = card;
      } else {
        discardPile.addCard(card);
      }
    }
    if (discardPile.size() > 0) {
      await attackedIe.discardCards(discardPile, CardLocation.REVEAL_LIMBO);
    }
    if (targetCard === undefined) {
      return;
    }
    const trashedCost = targetCard.getCost();
    await attackedIe.trashCardFromSet(targetCard, new CardCollection(targetCard));
    if (trashedCost.coins >= 2) {
      const maxCost = trashedCost.plus(-2);
      const toGain: Card | Choice = await attackedIe
        .chooseCard(`You may gain a card costing up to $${maxCost.coins}`)
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsUpTo(maxCost))
        .allowNoneOption()
        .choose();
      if (toGain instanceof Card) {
        await attackedIe.gainCardFromPile(toGain);
      }
    }
  }
}
