import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Lurker extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Lurker'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    await ie
      .chooseOneOption('Do you want to trash a card from the Supply or gain a card from the Trash?')
      .from(
        new ActionChoice('Trash an Action card from the Supply', async () => {
          const cardToTrash = await ie
            .chooseCard('Choose an Action card from the Supply to trash')
            .from(CardSelectionLocation.SUPPLY)
            .to(CardSelectionPurpose.TRASH)
            .choose();
          if (cardToTrash instanceof Card) {
            return ie.trashCardFromLocation(cardToTrash, CardLocation.PILE);
          }
        }),
      )
      .from(
        new ActionChoice('Gain an Action card from the Trash', async () => {
          const cardToGain = await ie
            .chooseCard('Choose an Action card to gain from the Trash.')
            .from(CardLocation.TRASH)
            .to(CardSelectionPurpose.GAIN)
            .choose();
          if (cardToGain instanceof Card) {
            return ie.gainCardFromTrash(cardToGain);
          }
        }),
      )
      .choose();
  }
}
