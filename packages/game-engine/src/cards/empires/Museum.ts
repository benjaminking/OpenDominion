import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Museum extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Museum'));
  }

  score(allCardGroups: CardCollection[]): number {
    // 2 VP per differently named card you have
    const uniqueNames = new Set<string>();
    for (const cardGroup of allCardGroups) {
      for (const name of cardGroup.toCardNameArray()) {
        uniqueNames.add(name);
      }
    }
    return 2 * uniqueNames.size;
  }
}
