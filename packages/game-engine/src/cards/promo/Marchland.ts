import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

// Marchland (Victory): Worth 1 VP per 3 Victory cards you have (round down).
export class Marchland extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Marchland'));
  }

  public score(allCardGroups: CardCollection[]): number {
    let numVictory = 0;
    for (const cardGroup of allCardGroups) {
      numVictory += cardGroup.numMatchingCards(isVictoryCard);
    }
    return Math.floor(numVictory / 3);
  }
}
