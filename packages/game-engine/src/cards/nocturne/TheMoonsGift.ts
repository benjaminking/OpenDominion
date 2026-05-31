import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Boon } from '../../card/Boon';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class TheMoonsGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Moon's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    const cardToTopdeck: Card | Choice = await ie
      .chooseCard('You may put a card from your discard pile onto your deck')
      .from(CardLocation.DISCARD)
      .to(CardSelectionPurpose.TOPDECK)
      .allowNoneOption()
      .choose();
    if (cardToTopdeck instanceof Card) {
      await ie.topDeckCardFromLocation(cardToTopdeck, CardLocation.DISCARD);
    }
  }
}
