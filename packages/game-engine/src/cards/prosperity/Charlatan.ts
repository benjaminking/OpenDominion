import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { CardReplacingSetupRule } from '../../game-state/CardReplacingSetupRule';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';

export class Charlatan extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Charlatan'));
    this.sharedGameState.addSetupRule(this.getName(), new CardReplacingSetupRule('Curse', 'CharlatanCurse'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(3);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().gainCardFromPile('Curse');
  }
}
