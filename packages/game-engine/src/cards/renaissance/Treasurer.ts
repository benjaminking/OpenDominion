import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Treasurer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Treasurer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(3);
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Trash a Treasure from your hand', async () => {
          const cardToTrash: Card | Choice = await ie
            .chooseCard('Choose a Treasure to trash from your hand')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.TRASH)
            .whereCardIs(isTreasureCard)
            .allowNoneOption()
            .choose();
          if (cardToTrash instanceof Card) {
            await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
          }
        }),
      )
      .from(
        new ActionChoice('Gain a Treasure from the trash to your hand', async () => {
          const cardToGain: Card | Choice = await ie
            .chooseCard('Choose a Treasure from the trash to gain to your hand')
            .from(CardLocation.TRASH)
            .to(CardSelectionPurpose.GAIN)
            .whereCardIs(isTreasureCard)
            .allowNoneOption()
            .choose();
          if (cardToGain instanceof Card) {
            await ie.gainCardFromTrash(cardToGain, CardLocation.HAND);
          }
        }),
      )
      .from(
        new ActionChoice('Take the Key', () => {
          ie.takeArtifact('Key');
        }),
      )
      .choose();
  }
}
