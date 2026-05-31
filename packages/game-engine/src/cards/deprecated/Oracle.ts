import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

// Oracle (Action/Attack): Each player (including you) reveals the top 2 cards of their deck;
// you choose whether they discard them or put them back in any order. Then +2 Cards.
export class Oracle extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Oracle'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.eachPlayer(async (playerIe: InstructionExecutor) => {
      const topCards = await playerIe.takeCardsOffDeck(2);
      await playerIe.revealCards(topCards);
      if (topCards.size() === 0) {
        return;
      }
      await ie
        .chooseOneOption(`Oracle: discard or put back ${topCards.size()} cards for target?`)
        .from(
          new ActionChoice('Discard', async () => {
            await playerIe.discardCards(topCards, CardLocation.REVEAL_LIMBO);
          }),
        )
        .from(
          new ActionChoice('Put back', async () => {
            await playerIe.topDeckCardsFromRevealedSet(topCards);
          }),
        )
        .choose();
    });
    await ie.drawCards(2);
  }
}
