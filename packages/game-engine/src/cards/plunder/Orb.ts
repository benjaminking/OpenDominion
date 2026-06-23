import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { either, isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Orb extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Orb'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one')
      .from(
        new ActionChoice('Play an Action or Treasure from your discard pile', async () => {
          const cardToPlay: Card | Choice = await ie
            .chooseCard('You may play an Action or Treasure from your discard pile')
            .from(CardLocation.DISCARD)
            .to(CardSelectionPurpose.PLAY_ALT)
            .whereCardIs(either(isActionCard, isTreasureCard))
            .allowNoneOption()
            .choose();
          if (cardToPlay instanceof Card) {
            await ie.playCardFromLocation(cardToPlay, CardLocation.DISCARD);
          }
        }),
      )
      .from(
        new ActionChoice('+1 Buy and +$3', async () => {
          ie.addBuys(1);
          await ie.addCoins(3);
        }),
      )
      .choose();
  }
}
