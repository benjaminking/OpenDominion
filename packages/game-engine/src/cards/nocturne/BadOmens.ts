import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Hex } from '../../card/Hex';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

// Bad Omens: Put your deck into your discard pile. Look through it and put 2 Coppers from it onto your deck (or reveal you can't).
export class BadOmens extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bad Omens'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    await ie.moveDeckToDiscard();
    // Topdeck up to 2 Coppers from discard
    for (let i = 0; i < 2; i++) {
      const copper: Card | Choice = await ie
        .chooseCard('Put a Copper from your discard onto your deck (or reveal you have none)')
        .from(CardLocation.DISCARD)
        .to(CardSelectionPurpose.TOPDECK)
        .whereCardIs(cardNameIs('Copper'))
        .allowNoneOption()
        .choose();
      if (copper instanceof Card) {
        await ie.topDeckCardFromLocation(copper, CardLocation.DISCARD);
      } else {
        break;
      }
    }
  }
}
