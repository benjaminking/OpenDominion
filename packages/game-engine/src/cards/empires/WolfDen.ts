import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class WolfDen extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wolf Den'));
  }

  score(allCardGroups: CardCollection[]): number {
    // -3 VP for each card name of which you have exactly 1 copy
    const nameCounts = new Map<string, number>();
    for (const cardGroup of allCardGroups) {
      for (const name of cardGroup.toCardNameArray()) {
        nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
      }
    }
    let penalty = 0;
    for (const count of nameCounts.values()) {
      if (count === 1) {
        penalty -= 3;
      }
    }
    return penalty;
  }
}
