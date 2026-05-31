import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, isDurationCard, isTreasureCard, not } from '../../StandardCardEligibilityFunctions';

export class Counterfeit extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Counterfeit'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    ie.addBuys(1);

    const choice: Card | Choice = await ie
      .chooseCard('Choose a non-Duration Treasure card from your hand to play twice then trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(both(isTreasureCard, not(isDurationCard)))
      .allowNoneOption()
      .choose();

    if (choice instanceof Card) {
      await ie.playCardFromHandNTimes(choice, 2);
      await ie.trashCardFromLocation(choice, CardLocation.IN_PLAY);
    }
  }
}
