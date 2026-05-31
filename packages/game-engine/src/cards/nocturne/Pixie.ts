import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Pixie (Action/Fate): +1 Card, +1 Action. Discard the top Boon.
// You may trash this to receive that Boon twice.
// The Boon deck discard/receive-twice mechanic requires engine support; receiveBoon() is used as approximation.
export class Pixie extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pixie'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie
      .chooseOneOption('You may trash Pixie to receive the top Boon twice')
      .from(
        new ActionChoice('Trash Pixie and receive Boon twice', async () => {
          await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
          await ie.receiveBoon();
          await ie.receiveBoon();
        }),
      )
      .from(
        new ActionChoice('Just discard the top Boon', async () => {
          // Boon is discarded without being received
        }),
      )
      .choose();
  }
}
