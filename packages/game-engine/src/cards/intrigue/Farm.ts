import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Farm extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Farm'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 2;
  }
}
