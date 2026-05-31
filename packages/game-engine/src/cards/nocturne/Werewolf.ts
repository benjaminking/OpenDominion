import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

// Werewolf (Action/Night/Attack/Doom):
// If it's your Night phase, each other player receives the next Hex.
// Otherwise, +3 Cards.
export class Werewolf extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Werewolf'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    if (ie.isNightPhase()) {
      await ie.performAttack(this, this.hexAttack.bind(this));
    } else {
      await ie.drawCards(3);
    }
  }

  public async hexAttack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    await attackedIe.receiveNextHex();
  }
}
