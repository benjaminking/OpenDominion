import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Duke extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Duke'));
  }

  public score(allCardGroups: CardCollection[]): number {
    let numDuchies = 0;
    for (const cardGroup of allCardGroups) {
      numDuchies += cardGroup.numMatchingCards(cardNameIs('Duchy'));
    }
    return numDuchies;
  }
}
