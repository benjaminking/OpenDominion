import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Spy (Action/Attack): +1 Card, +1 Action.
// Each player (including you) reveals the top card of their deck
// and either discards it or puts it back, your choice.
export class Spy extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Spy'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.eachPlayer(async (targetIe: InstructionExecutor) => {
      await this.spyOn(ie, targetIe);
    });
  }

  private async spyOn(spyIe: InstructionExecutor, targetIe: InstructionExecutor): Promise<void> {
    const topCard = await targetIe.takeCardOffDeck();
    if (topCard === undefined) {
      return;
    }
    const revealSet = new CardCollection(topCard);
    await targetIe.revealCards(revealSet);
    await spyIe
      .chooseOneOption(`Spy on ${topCard.getName()}: discard or put back?`)
      .from(
        new ActionChoice('Discard', async () => {
          await targetIe.discardCards(revealSet, topCard.getLocation());
        }),
      )
      .from(
        new ActionChoice('Put back', async () => {
          targetIe.putCardOnDeck(topCard);
        }),
      )
      .choose();
  }
}
