import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Miller extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Miller'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    const revealed = await ie.takeCardsOffDeck(4);
    await ie.revealCards(revealed);

    if (revealed.isEmpty()) {
      return;
    }

    const picked = await ie
      .chooseCard('Put one into your hand')
      .from(revealed)
      .to(CardSelectionPurpose.DRAW)
      .choose();
    if (picked instanceof Card) {
      ie.putCardIntoHandFromLocation(picked, CardLocation.REVEAL_LIMBO);
      revealed.removeCard(picked);
    }
    await ie.discardCardsFromLocation(revealed, CardLocation.REVEAL_LIMBO);
  }
}
