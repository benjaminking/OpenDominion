import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Ritual extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ritual'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Gain a Curse; if you did, trash a card from hand and +1VP per $1 it costs
    const curse = await ie.gainCardFromPile('Curse');
    if (curse === undefined) {
      return;
    }

    const cardToTrash: Card | Choice = await ie
      .chooseCard('Trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();

    if (!(cardToTrash instanceof Card)) {
      return;
    }

    const coinCost = ie.getSharedGameState().cost(cardToTrash).coins;
    const trashed = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashed !== undefined) {
      ie.addVP(coinCost);
    }
  }
}
