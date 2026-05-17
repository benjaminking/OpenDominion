import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class NativeVillage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Native Village'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Put the top card of your deck face down on your Native Village mat', async () => {
          await ie.putTopCardOfDeckOnNativeVillageMat();
        }),
      )
      .from(
        new ActionChoice('Put all the cards from your Native Village mat into your hand', () => {
          ie.putCardsFromNativeVillageMatIntoHand();
        }),
      )
      .choose();
  }
}
