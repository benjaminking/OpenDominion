import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Save extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Save'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Once per turn: +1 Buy. Set aside a card from your hand, put into hand at end of turn.
    if (ie.oncePerTurn('Save')) {
      return;
    }
    ie.addBuys(1);
    const cardToSetAside: Card | Choice = await ie
      .chooseCard('Set aside a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .allowNoneOption()
      .choose();
    if (cardToSetAside instanceof Card) {
      // Set aside the card; it will return to hand in cleanup.
      // TODO: implement proper cleanup return (requires Effect from Card, not Event)
      await ie.setCardAsideFromLocation(cardToSetAside, CardLocation.HAND);
    }
  }
}
