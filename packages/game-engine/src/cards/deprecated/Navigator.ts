import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Navigator (Action): +$2. Look at the top 5 cards of your deck. Either discard them all,
// or put them back in any order.
export class Navigator extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Navigator'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    const topCards = await ie.takeCardsOffDeck(5);
    await ie
      .chooseOneOption('Discard all 5, or put them back in any order?')
      .from(
        new ActionChoice('Discard all', async () => {
          await ie.discardCards(topCards, CardLocation.REVEAL_LIMBO);
        }),
      )
      .from(
        new ActionChoice('Put back in any order', async () => {
          await ie.topDeckCardsFromRevealedSet(topCards);
        }),
      )
      .choose();
  }
}
