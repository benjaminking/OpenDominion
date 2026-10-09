import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { either, isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class CrystalBall extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Crystal Ball'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);

    const topCard: Card | undefined = await ie.lookAtTopCardOfDeck();
    if (topCard === undefined) {
      return;
    }

    await ie.revealCard(topCard);

    const choiceBuilder = ie
      .chooseOneOption('What do you want to do with ' + topCard.getName() + '?')
      .from(
        new ActionChoice('Trash it', async () => {
          await ie.trashCardFromLocation(topCard, CardLocation.DECK);
        }),
      )
      .from(
        new ActionChoice('Discard it', async () => {
          await ie.discardCardFromLocation(topCard, CardLocation.DECK);
        }),
      );

    if (either(isActionCard, isTreasureCard).matches(topCard)) {
      choiceBuilder.from(
        new ActionChoice('Play it', async () => {
          await ie.playCardFromLocation(topCard, CardLocation.DECK);
        }),
      );
    }

    choiceBuilder.from(new ActionChoice('Leave it on top'));

    await choiceBuilder.choose();
  }
}
