import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Swashbuckler extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Swashbuckler'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    if (ie.getDiscardPileSize() > 0) {
      ie.addCoffers(1);
      // If the player now has 4+ Coffers, take the Treasure Chest artifact.
      if (ie.getCoffers() >= 4) {
        ie.takeArtifact('Treasure Chest');
      }
    }
  }
}
