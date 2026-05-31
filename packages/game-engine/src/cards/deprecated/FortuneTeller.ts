import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard, cardNameIs } from '../../StandardCardEligibilityFunctions';

const isVictoryOrCurse = new CardEligibilityFunction(
  (c: Card) => isVictoryCard.matches(c) || cardNameIs('Curse').matches(c),
);

// Fortune Teller (Action/Attack): +$2. Each other player reveals cards from the top of their deck
// until they reveal a Victory card or a Curse. They put it on top and discard the rest.
export class FortuneTeller extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fortune Teller'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    const discardPile = new CardCollection();
    let found = false;
    while (!found) {
      const card = await attackedIe.takeCardOffDeck();
      if (card === undefined) {
        break;
      }
      if (isVictoryOrCurse.matches(card)) {
        attackedIe.putCardOnDeck(card);
        found = true;
      } else {
        discardPile.addCard(card);
      }
    }
    if (discardPile.size() > 0) {
      await attackedIe.discardCards(discardPile, CardLocation.REVEAL_LIMBO);
    }
  }
}
