import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class KingsCache extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("King's Cache"));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const treasureToPlay: Card | Choice = await ie
      .chooseCard('You may play a Treasure from your hand 3 times')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();

    if (treasureToPlay instanceof Card) {
      await ie.playCardFromHandNTimes(treasureToPlay, 3);
    }
  }
}
