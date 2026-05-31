import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

// Tragic Hero: +3 Cards, +1 Buy. If you have 8 or more cards in hand (after drawing),
// trash this and gain a Treasure.
export class TragicHero extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tragic Hero'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    ie.addBuys(1);
    if (ie.handSize() >= 8) {
      await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
      const treasure: Card | Choice = await ie
        .chooseCard('Gain a Treasure from the supply')
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(isTreasureCard)
        .choose();
      if (treasure instanceof Card) {
        await ie.gainCardFromPile(treasure.getPileName());
      }
    }
  }
}
