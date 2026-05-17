import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Island extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Island'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.putCardOnIslandMatFromHand(this);
    const cardToSetAside: Card | Choice = await ie
      .chooseCard('Choose a card to put on your Island mat')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .choose();
    if (!(cardToSetAside instanceof Card)) {
      return;
    }
    ie.putCardOnIslandMatFromHand(cardToSetAside);
  }
}
