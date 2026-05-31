import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Ferryman: +2 Cards, +1 Action; discard a card.
// Setup: Choose a Kingdom card pile costing $3 or $4 to add to the game.
// When you gain Ferryman, gain one of those cards. (setup/gain effect is a stub)
export class Ferryman extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ferryman'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    ie.addActions(1);

    // TODO: when you gain Ferryman, gain a card from the chosen $3–$4 pile
    // (requires a setup-chosen bonus pile not yet implemented in engine)

    const toDiscard: Card | Choice = await ie
      .chooseCard('Discard a card')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    if (toDiscard instanceof Card) {
      await ie.discardCardFromLocation(toDiscard, CardLocation.HAND);
    }
  }
}
