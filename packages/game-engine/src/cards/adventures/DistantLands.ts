import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class DistantLands extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Distant Lands'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.putCardOnTavernMat(this);
  }

  public score(_allCardGroups: CardCollection[]): number {
    // Worth 4VP if on Tavern mat; stub returns 0
    // TODO: when Tavern mat is implemented, check if card is on it
    return 0;
  }
}
