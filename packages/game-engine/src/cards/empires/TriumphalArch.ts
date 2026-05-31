import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class TriumphalArch extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Triumphal Arch'));
  }

  score(allCardGroups: CardCollection[]): number {
    // 3 VP per copy of the 2nd most-common Action card you have
    const nameCounts = new Map<string, number>();
    for (const cardGroup of allCardGroups) {
      for (const card of cardGroup.asCardArray()) {
        if (isActionCard.matches(card)) {
          nameCounts.set(card.getName(), (nameCounts.get(card.getName()) ?? 0) + 1);
        }
      }
    }
    const counts = Array.from(nameCounts.values()).sort((a, b) => b - a);
    if (counts.length < 2) {
      return 0;
    }
    return 3 * counts[1];
  }
}
