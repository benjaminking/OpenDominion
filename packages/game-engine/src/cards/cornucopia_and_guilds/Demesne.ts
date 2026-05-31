import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

// Demesne (Reward): +2 Actions, +2 Buys; gain a Gold.
// Worth 1VP per Gold you have.
export class Demesne extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Demesne'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    ie.addBuys(2);
    await ie.gainFromPile('Gold');
  }

  public score(allCardGroups: CardCollection[]): number {
    let goldCount = 0;
    for (const collection of allCardGroups) {
      for (const card of collection.asCardArray()) {
        if (card.getName() === 'Gold') {
          goldCount++;
        }
      }
    }
    return goldCount;
  }
}
