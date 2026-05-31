import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Harem (Treasure/Victory): $2. Worth 2 VP.
export class Harem extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Harem'));
    this.setCoins(2);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
  }

  public score(_allCardGroups: CardCollection[]): number {
    return 2;
  }
}
