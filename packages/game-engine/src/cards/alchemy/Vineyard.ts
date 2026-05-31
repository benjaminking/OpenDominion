import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Vineyard extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Vineyard'));
  }

  public score(allCardGroups: CardCollection[]): number {
    let numActions = 0;
    for (const cardGroup of allCardGroups) {
      numActions += cardGroup.numMatchingCards(isActionCard);
    }
    return Math.floor(numActions / 3);
  }
}
