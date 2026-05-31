import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { KnightCard } from './KnightCard';

export class DameJosephine extends KnightCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Dame Josephine'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.performAttack(this, this.knightAttack.bind(this));
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 2;
  }
}
