import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Zombie Spy (Action/Zombie): +1 Card, +1 Action.
// Look at the top card of your deck. Discard it or put it back.
export class ZombieSpy extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Zombie Spy'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const topCard = await ie.lookAtTopCardOfDeck();
    if (topCard !== undefined) {
      await ie
        .chooseOneOption('Discard the top card or put it back?')
        .from(
          new ActionChoice('Discard', async () => {
            const top = await ie.takeCardOffDeck();
            if (top !== undefined) {
              await ie.discardCard(top);
            }
          }),
        )
        .from(new ActionChoice('Put back', () => {}))
        .choose();
    }
  }
}
