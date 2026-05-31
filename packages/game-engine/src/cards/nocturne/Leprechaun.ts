import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyCard } from '../../StandardCardEligibilityFunctions';

// Leprechaun (Action/Doom): Gain a Gold.
// If you have exactly 7 cards in play, gain a Wish. Otherwise, receive a Hex.
export class Leprechaun extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Leprechaun'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Gold');
    if (ie.numMatchingCardsInPlay(anyCard) === 7) {
      await ie.gainFromSpiritPile('Wish');
    } else {
      await ie.receiveNextHex();
    }
  }
}
