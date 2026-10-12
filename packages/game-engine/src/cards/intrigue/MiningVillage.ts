import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class MiningVillage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mining Village'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Under Throne Room, the first play may already have trashed this
    const locationExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
    await ie.drawCards(1);
    ie.addActions(2);

    await ie
      .chooseOneOption('Do you want to trash this Mining Village for +$2?')
      .from(
        new ActionChoice('Yes', async () => {
          if (!locationExpectation.isMet(this)) {
            ie.sendLostTrackMessage(this);
            return;
          }
          const trashedCard: Card | undefined = await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
          if (trashedCard !== undefined) {
            await ie.addCoins(2);
          }
        }),
      )
      .from(
        new ActionChoice('No', () => {
          //
        }),
      )
      .choose();
  }
}
