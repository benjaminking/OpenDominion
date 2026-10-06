import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Survivors extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Survivors'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const topCards = await ie.takeCardsOffDeck(2);
    await ie.revealCards(topCards);

    if (topCards.size() === 0) {
      return;
    }

    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Discard them', async () => {
          await ie.discardCardsFromRevealedSet(topCards);
        }),
      )
      .from(
        new ActionChoice('Put them back on top', async () => {
          await ie.topDeckCardsFromRevealedSet(topCards);
        }),
      )
      .choose();
  }
}
