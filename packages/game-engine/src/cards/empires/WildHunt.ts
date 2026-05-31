import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class WildHunt extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wild Hunt'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+3 Cards and add 1 VP to the Wild Hunt pile', async () => {
          await ie.drawCards(3);
          ie.addPileVPTokens('Wild Hunt', 1);
        }),
      )
      .from(
        new ActionChoice('Gain an Estate and take the VP from the Wild Hunt pile', async () => {
          const gained = await ie.gainCardFromPile('Estate');
          if (gained !== undefined) {
            const vp = ie.takePileVPTokens('Wild Hunt');
            ie.addVP(vp);
          }
        }),
      )
      .choose();
  }
}
