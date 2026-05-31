import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Orchard extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Orchard'));
  }

  score(allCardGroups: CardCollection[]): number {
    // 4 VP per Action card name of which you have 3 or more copies
    const nameCounts = new Map<string, number>();
    for (const cardGroup of allCardGroups) {
      for (const card of cardGroup.asCardArray()) {
        if (isActionCard.matches(card)) {
          nameCounts.set(card.getName(), (nameCounts.get(card.getName()) ?? 0) + 1);
        }
      }
    }
    let vp = 0;
    for (const count of nameCounts.values()) {
      if (count >= 3) {
        vp += 4;
      }
    }
    return vp;
  }
}
