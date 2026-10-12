import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Disciple extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Disciple'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToPlay: Card | Choice = await ie
      .chooseCard('You may play an Action card from your hand twice')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY)
      .allowNoneOption()
      .choose();
    if (cardToPlay instanceof Card) {
      await ie.playCardFromHandNTimes(cardToPlay, 2);
      await ie.gainCardFromPile(cardToPlay);
    }
  }
}
