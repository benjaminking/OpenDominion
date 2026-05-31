import { CardInfoLookup } from '@dominion/card-info';

import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { KnightCard } from './KnightCard';

export class DameSylvia extends KnightCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Dame Sylvia'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie.performAttack(this, this.knightAttack.bind(this));
  }
}
