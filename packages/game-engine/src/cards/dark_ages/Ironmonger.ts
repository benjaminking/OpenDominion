import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard, isTreasureCard, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Ironmonger extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ironmonger'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const topCard = await ie.lookAtTopCardOfDeck();
    if (topCard === undefined) {
      return;
    }

    await ie.revealCard(topCard);

    await ie
      .chooseOneOption('Do you want to discard ' + topCard.getName() + '?')
      .from(
        new ActionChoice('Yes, discard it', async () => {
          await ie.discardCard(topCard);
        }),
      )
      .from(
        new ActionChoice('No, keep it on top', () => {
          ie.putCardOnDeck(topCard);
        }),
      )
      .choose();

    // Bonus based on type (regardless of discard choice)
    if (isActionCard.matches(topCard)) {
      ie.addActions(1);
    }
    if (isTreasureCard.matches(topCard)) {
      await ie.addCoins(1);
    }
    if (isVictoryCard.matches(topCard)) {
      await ie.drawCards(1);
    }
  }
}
