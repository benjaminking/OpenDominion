import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard } from '../../StandardCardEligibilityFunctions';

export class SnakeWitch extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Snake Witch'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const cardsInHand = ie.getMatchingCardsInHand(anyCard);
    const namesInHand = new Set<string>();
    let hasDuplicate = false;
    for (const card of cardsInHand) {
      if (namesInHand.has(card.getName())) {
        hasDuplicate = true;
        break;
      }
      namesInHand.add(card.getName());
    }
    if (hasDuplicate) {
      return;
    }

    await ie
      .chooseOneOption('You may reveal your hand and return this to its pile to have each other player gain a Curse')
      .from(
        new ActionChoice('Reveal hand and return Snake Witch', async () => {
          await ie.revealHand();
          ie.returnCardToPileFromLocation(this, CardLocation.IN_PLAY);
          await ie.eachOtherPlayer(async (otherIe: InstructionExecutor) => {
            await otherIe.gainCardFromPile('Curse');
          });
        }),
      )
      .from(new ActionChoice('Do nothing', () => Promise.resolve()))
      .choose();
  }
}
