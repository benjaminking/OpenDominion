import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, isActionCard, isTreasureCard, not, isRewardCard } from '../../StandardCardEligibilityFunctions';

// Coronet (Reward): Choose one: Play a non-Reward Action from your hand twice;
// or play a non-Reward Treasure from your hand twice.
export class Coronet extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Coronet'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Play a non-Reward Action from your hand twice', async () => {
          const card: Card | Choice = await ie
            .chooseCard('Choose a non-Reward Action to play twice')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.PLAY_ALT)
            .whereCardIs(both(isActionCard, not(isRewardCard)))
            .allowNoneOption()
            .choose();
          if (card instanceof Card) {
            await ie.playCardFromHandNTimes(card, 2);
          }
        }),
      )
      .from(
        new ActionChoice('Play a non-Reward Treasure from your hand twice', async () => {
          const card: Card | Choice = await ie
            .chooseCard('Choose a non-Reward Treasure to play twice')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.PLAY_ALT)
            .whereCardIs(both(isTreasureCard, not(isRewardCard)))
            .allowNoneOption()
            .choose();
          if (card instanceof Card) {
            await ie.playCardFromHandNTimes(card, 2);
          }
        }),
      )
      .choose();
  }
}
