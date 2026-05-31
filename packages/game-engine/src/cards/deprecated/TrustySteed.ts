import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Trusty Steed (Action/Reward, non-supply): Choose two (not the same): +2 Cards; +2 Actions; +$2; gain 4 Silvers and put your deck into your discard pile.
// "Choose two different" mechanic not fully supported; implemented as two independent chooseOneOption calls.
export class TrustySteed extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Trusty Steed'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // TODO: "Choose two different" mechanic not fully supported — player may pick the same option twice.
    for (let i = 0; i < 2; i++) {
      await ie
        .chooseOneOption(`Trusty Steed choice ${i + 1}`)
        .from(
          new ActionChoice('+2 Cards', async () => {
            await ie.drawCards(2);
          }),
        )
        .from(
          new ActionChoice('+2 Actions', async () => {
            ie.addActions(2);
          }),
        )
        .from(
          new ActionChoice('+$2', async () => {
            await ie.addCoins(2);
          }),
        )
        .from(
          new ActionChoice('Gain 4 Silvers + put deck in discard', async () => {
            for (let j = 0; j < 4; j++) {
              await ie.gainCardFromPile('Silver');
            }
            ie.moveDeckToDiscard();
          }),
        )
        .choose();
    }
  }
}
