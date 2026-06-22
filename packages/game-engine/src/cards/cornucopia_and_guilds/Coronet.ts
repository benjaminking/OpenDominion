import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, isActionCard, isRewardCard,isTreasureCard, not } from '../../StandardCardEligibilityFunctions';

export class Coronet extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Coronet'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const actionCard: Card | Choice = await ie
      .chooseCard('Choose a non-Reward Action to play twice')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(both(isActionCard, not(isRewardCard)))
      .allowNoneOption()
      .choose();
    if (actionCard instanceof Card) {
      await ie.playCardFromHandNTimes(actionCard, 2);
    }
    const treasureCard: Card | Choice = await ie
      .chooseCard('Choose a non-Reward Treasure to play twice')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(both(isTreasureCard, not(isRewardCard)))
      .allowNoneOption()
      .choose();
    if (treasureCard instanceof Card) {
      await ie.playCardFromHandNTimes(treasureCard, 2);
    }
  }
}
