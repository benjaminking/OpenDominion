import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

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
      goldCount += collection.getMatchingCards(cardNameIs('gold')).size();
    }
    return goldCount;
  }
}
