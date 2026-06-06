import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Investment extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Investment'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();

    if (cardToTrash instanceof Card) {
      await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    }

    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+$1', async () => {
          await ie.addCoins(1);
        }),
      )
      .from(
        new ActionChoice('Trash this for VP', async () => {
          await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
          await ie.revealHand();
          const differentlyNamedTreasures = new Set<string>();
          for (const treasure of ie.getMatchingCardsInHand(isTreasureCard)) {
            differentlyNamedTreasures.add(treasure.getName());
          }
          ie.addVP(differentlyNamedTreasures.size);
        }),
      )
      .choose();
  }
}
