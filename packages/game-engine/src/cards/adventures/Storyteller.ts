import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Storyteller extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Storyteller'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    // Play up to 3 Treasures from your hand
    const treasuresToPlay = await ie
      .chooseCards('Play up to 3 Treasures from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY)
      .whereCardIs(isTreasureCard)
      .whereNumCardsIs(upToNChecked(3))
      .choose();

    for (const treasure of treasuresToPlay.asCardArray()) {
      await ie.playCardFromLocation(treasure, CardLocation.HAND);
    }

    // +1 Card, then pay all $ for +1 Card per $ paid
    await ie.drawCards(1);
    const coins = ie.getCoinsAvailable();
    if (coins > 0) {
      await ie.spendAllCoins();
      await ie.drawCards(coins);
    }
  }
}
