import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

// Sea Hag (Action/Attack): Each other player discards the top card of their deck, then gains a Curse onto their deck.
export class SeaHag extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sea Hag'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    const topCard = await attackedIe.takeCardOffDeck();
    if (topCard !== undefined) {
      await attackedIe.discardCardFromLocation(topCard, topCard.getLocation());
    }
    await attackedIe.gainCardFromPile('Curse', CardLocation.DECK);
  }
}
