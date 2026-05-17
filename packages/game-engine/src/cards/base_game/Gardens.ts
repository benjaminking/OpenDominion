import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../SharedGameState';

export class Gardens extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Gardens'));
  }

  score(allCardGroups: CardCollection[]): number {
    let numTotalCards = 0;
    for (const cardGroup of allCardGroups) {
      numTotalCards += cardGroup.size();
    }
    return Math.floor(numTotalCards / 10);
  }
}
