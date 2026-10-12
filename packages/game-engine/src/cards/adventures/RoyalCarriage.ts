import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class RoyalCarriage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Royal Carriage'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    ie.putCardOnTavernMat(this);
  }
}
