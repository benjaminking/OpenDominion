import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

// Zombie Apprentice (Action/Zombie): You may trash an Action from your hand for +3 Cards and +1 Action.
export class ZombieApprentice extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Zombie Apprentice'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('You may trash an Action for +3 Cards, +1 Action')
      .from(
        new ActionChoice('Trash an Action card', async () => {
          const cardToTrash: Card | Choice = await ie
            .chooseCard('Trash an Action from your hand')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.TRASH)
            .whereCardIs(isActionCard)
            .choose();
          if (cardToTrash instanceof Card) {
            await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
            await ie.drawCards(3);
            ie.addActions(1);
          }
        }),
      )
      .from(new ActionChoice('Skip', () => {}))
      .choose();
  }
}
