import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Harbinger extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Harbinger'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const cardChoice: Card | Choice = await ie
      .chooseCard('Choose a card to put on top of your deck')
      .from(CardLocation.DISCARD)
      .to(CardSelectionPurpose.TOPDECK)
      .allowNoneOption()
      .choose();
    if (cardChoice instanceof Card) {
      await ie.topDeckCardFromLocation(cardChoice, CardLocation.DISCARD);
    }
  }
}
