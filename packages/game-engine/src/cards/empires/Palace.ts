import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Palace extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Palace'));
  }

  score(allCardGroups: CardCollection[]): number {
    // 3 VP per set of Copper, Silver, Gold you have
    let numCoppers = 0;
    let numSilvers = 0;
    let numGolds = 0;
    for (const cardGroup of allCardGroups) {
      numCoppers += cardGroup.numMatchingCards(cardNameIs('Copper'));
      numSilvers += cardGroup.numMatchingCards(cardNameIs('Silver'));
      numGolds += cardGroup.numMatchingCards(cardNameIs('Gold'));
    }
    return 3 * Math.min(numCoppers, numSilvers, numGolds);
  }
}
