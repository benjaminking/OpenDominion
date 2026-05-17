import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class TreasureMap extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Treasure Map'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);

    const secondMap: Card | Choice = await ie
      .chooseCard('You may trash another Treasure Map')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(cardNameIs('Treasure Map'))
      .choose();

    if (secondMap instanceof Card) {
      await ie.trashCardFromLocation(secondMap, CardLocation.HAND);
      for (let i = 0; i < 4; i++) {
        await ie.gainFromPile('gold', CardLocation.DECK);
      }
    }
  }
}
