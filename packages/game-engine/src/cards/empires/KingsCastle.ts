import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../SharedGameState';
import { isCastleCard } from '../../StandardCardEligibilityFunctions';

export class KingsCastle extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("King's Castle"));
  }

  public score(allCardGroups: CardCollection[]): number {
    let numCastles = 0;
    for (const cardGroup of allCardGroups) {
      numCastles += cardGroup.numMatchingCards(isCastleCard);
    }
    return 2 * numCastles;
  }
}
