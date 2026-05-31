import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs, either } from '../../StandardCardEligibilityFunctions';

export class BanditFort extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bandit Fort'));
  }

  score(allCardGroups: CardCollection[]): number {
    let numSilversAndGolds = 0;
    for (const cardGroup of allCardGroups) {
      numSilversAndGolds += cardGroup.numMatchingCards(either(cardNameIs('Silver'), cardNameIs('Gold')));
    }
    return -2 * numSilversAndGolds;
  }
}
