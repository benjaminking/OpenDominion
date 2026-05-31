import { CardInfoLookup } from '@dominion/card-info';
import { CardType } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../SharedGameState';

export class Territory extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Territory'));
  }

  public score(allCardGroups: CardCollection[]): number {
    const names = new Set<string>();
    for (const group of allCardGroups) {
      for (const card of group) {
        if (card.hasType(CardType.VICTORY)) {
          names.add(card.getName());
        }
      }
    }
    return names.size;
  }
}
