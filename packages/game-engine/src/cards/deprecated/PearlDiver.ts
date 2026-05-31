import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Pearl Diver (Action): +1 Card, +1 Action.
// Look at the bottom card of your deck. You may put it on top.
// lookAtBottomCardOfDeck and putBottomCardOnTop are stubs.
export class PearlDiver extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pearl Diver'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const bottomCard = await ie.lookAtBottomCardOfDeck();
    if (bottomCard === undefined) {
      return;
    }
    await ie
      .chooseOneOption(`Bottom card: ${bottomCard.getName()}. Put it on top?`)
      .from(
        new ActionChoice('Put on top', async () => {
          ie.putBottomCardOnTop();
        }),
      )
      .from(new ActionChoice('Leave on bottom'))
      .choose();
    // TODO: lookAtBottomCardOfDeck and putBottomCardOnTop are stubs
  }
}
