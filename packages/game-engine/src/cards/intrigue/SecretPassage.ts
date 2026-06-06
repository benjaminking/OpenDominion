import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class SecretPassage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Secret Passage'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    ie.addActions(1);
    const cardToMove = await ie
      .chooseCard('Choose a card to put in your deck')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TOPDECK)
      .choose();

    if (!(cardToMove instanceof Card)) {
      return;
    }

    const depth = await ie.chooseDeckDepth();
    ie.putCardIntoDeck(cardToMove, depth);
  }
}
