import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Patron extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Patron'));
  }

  // Reaction: when revealed (e.g. by Militia), +1 Coffers.
  // Reaction trigger requires engine support for reveal-based reactions; noted as gap.
  public async onReveal(ie: InstructionExecutor): Promise<void> {
    ie.addCoffers(1);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addVillagers(1);
    await ie.addCoins(2);
  }
}
