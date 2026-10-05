import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';

export class Marauder extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Marauder'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Spoils');
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    // TODO: gainFromRuinsPile stub - gain a card from the Ruins pile
    await attackedPlayer.getInstructionExecutor().gainFromPile('Ruins');
  }
}
