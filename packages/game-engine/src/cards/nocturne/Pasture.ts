import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

// Pasture (Treasure/Victory/Heirloom): $1.
// Worth 1VP per Estate you have.
export class Pasture extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pasture'));
    this.setCoins(1);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    return ie.addCoins(1);
  }

  public score(allCardGroups: CardCollection[]): number {
    let numEstates = 0;
    for (const cardGroup of allCardGroups) {
      numEstates += cardGroup.numMatchingCards(cardNameIs('Estate'));
    }
    return numEstates;
  }
}
