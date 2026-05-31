import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Fountain extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fountain'));
  }

  score(allCardGroups: CardCollection[]): number {
    let numCoppers = 0;
    for (const cardGroup of allCardGroups) {
      numCoppers += cardGroup.numMatchingCards(cardNameIs('Copper'));
    }
    return numCoppers >= 10 ? 15 : 0;
  }
}
