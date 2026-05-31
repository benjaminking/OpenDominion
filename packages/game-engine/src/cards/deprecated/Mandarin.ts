import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Mandarin (Action): +$3. Put a card from your hand onto your deck.
// When you gain this, put all Treasures you have in play onto your deck.
export class Mandarin extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mandarin'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(3);
    const chosen: Card | Choice = await ie
      .chooseCard('Put a card from your hand onto your deck')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TOPDECK)
      .choose();
    if (chosen instanceof Card) {
      await ie.topDeckCardFromLocation(chosen, CardLocation.HAND);
    }
    // TODO: When gained, put all Treasures in play onto deck (on-gain effect not implemented)
  }
}
