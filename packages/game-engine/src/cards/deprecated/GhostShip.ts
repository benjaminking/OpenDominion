import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

// Ghost Ship (Action/Attack): +2 Cards. Each other player with 4+ cards puts cards from their
// hand onto their deck until they have 3 cards in hand.
export class GhostShip extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ghost Ship'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    while (attackedIe.handSize() > 3) {
      const toTopDeck: Card | Choice = await attackedIe
        .chooseCard('Put a card onto your deck (Ghost Ship)')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.TOPDECK)
        .choose();
      if (!(toTopDeck instanceof Card)) {
        break;
      }
      await attackedIe.topDeckCardFromLocation(toTopDeck, CardLocation.HAND);
    }
  }
}
