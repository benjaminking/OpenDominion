import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Miser extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Miser'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Put a Copper from your hand onto your Tavern mat', async () => {
          const cardToMove: Card | Choice = await ie
            .chooseCard('Choose a Copper to put on your Tavern mat')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.OTHER)
            .whereCardIs(cardNameIs('Copper'))
            .allowNoneOption()
            .choose();
          if (cardToMove instanceof Card) {
            ie.putCardOnTavernMat(cardToMove);
          }
        }),
      )
      .from(
        new ActionChoice('+ $1 per Copper on your Tavern mat', async () => {
          await ie.addCoins(ie.getNumCopperOnTavernMat());
        }),
      )
      .choose();
  }
}
