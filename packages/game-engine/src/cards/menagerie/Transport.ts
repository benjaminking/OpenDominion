import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { Event } from '../../card/Event';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Transport extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Transport'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Exile an Action card from the Supply', async () => {
          const choice = await ie
            .chooseCard('Choose an Action card to Exile')
            .from(CardSelectionLocation.SUPPLY)
            .to(CardSelectionPurpose.OTHER)
            .whereCardIs(isActionCard)
            .choose();
          if (choice instanceof Card) {
            await ie.exileFromSupply(choice);
          }
        }),
      )
      .from(
        new ActionChoice('Put an Action card you have in Exile onto your deck', async () => {
          await ie.putExiledActionOntoDeck();
        }),
      )
      .choose();
  }
}
