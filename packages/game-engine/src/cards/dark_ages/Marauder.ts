import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

export class Marauder extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Marauder'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // TODO: gainSpoils stub - gain a Spoils from the Spoils pile
    await ie.gainSpoils();
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    // TODO: gainFromRuinsPile stub - gain a card from the Ruins pile
    await attackedPlayer.getInstructionExecutor().gainFromRuinsPile();
  }
}
