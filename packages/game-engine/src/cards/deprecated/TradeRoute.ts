import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Trade Route (Action): +1 Buy. Trash a card from your hand. +$1 per token on the Trade Route mat.
// Trade Route mat mechanic is not yet implemented.
export class TradeRoute extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Trade Route'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    const chosen: Card | Choice = await ie
      .chooseCard('Trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();
    if (chosen instanceof Card) {
      await ie.trashCardFromLocation(chosen, CardLocation.HAND);
    }
    const tokens = ie.getCoinTokensOnMat('Trade Route');
    await ie.addCoins(tokens);
    // TODO: addCoinTokenToMat and getCoinTokensOnMat are stubs — Trade Route mat not yet implemented
  }
}
