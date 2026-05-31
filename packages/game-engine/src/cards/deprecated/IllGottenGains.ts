import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Ill-Gotten Gains (Treasure): $1. When you play this, you may gain a Copper to your hand.
// When you gain this, each other player gains a Curse (on-gain effect not implemented).
export class IllGottenGains extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ill-Gotten Gains'));
    this.setCoins(1);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    await ie
      .chooseOneOption('You may gain a Copper to your hand')
      .from(
        new ActionChoice('Gain Copper', async () => {
          await ie.gainCardFromPile('Copper', CardLocation.HAND);
        }),
      )
      .from(new ActionChoice('No'))
      .choose();
    // TODO: When gained, each other player gains a Curse (on-gain effect not implemented)
  }
}
