import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class Wall extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wall'));
  }

  score(allCardGroups: CardCollection[]): number {
    // -1 VP per card you have after the first 15
    let totalCards = 0;
    for (const cardGroup of allCardGroups) {
      totalCards += cardGroup.size();
    }
    return -Math.max(0, totalCards - 15);
  }
}
