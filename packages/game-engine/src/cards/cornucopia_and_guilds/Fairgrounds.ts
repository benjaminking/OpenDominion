import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';

export class Fairgrounds extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fairgrounds'));
  }

  public score(allCardGroups: CardCollection[]): number {
    const names = new Set<string>();
    for (const collection of allCardGroups) {
      for (const card of collection.asCardArray()) {
        names.add(card.getName());
      }
    }
    return Math.floor(names.size / 5) * 2;
  }
}
