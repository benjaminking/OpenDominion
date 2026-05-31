import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { either, isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class CrystalBall extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Crystal Ball'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);

    const topCard: Card | undefined = await ie.takeCardOffDeck();
    if (topCard === undefined) {
      return;
    }

    await ie.revealCard(topCard);

    const choiceBuilder = ie
      .chooseOneOption('What do you want to do with ' + topCard.getName() + '?')
      .from(
        new ActionChoice('Trash it', async () => {
          await ie.trashCard(topCard);
        }),
      )
      .from(
        new ActionChoice('Discard it', async () => {
          await ie.discardCard(topCard);
        }),
      );

    if (either(isActionCard, isTreasureCard).matches(topCard)) {
      choiceBuilder.from(
        new ActionChoice('Play it', async () => {
          await ie.playCardFromLocation(topCard, CardLocation.REVEAL_LIMBO);
        }),
      );
    }

    await choiceBuilder.choose();
  }
}
