import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, costsUpTo, isActionCard } from '../../StandardCardEligibilityFunctions';
import { Cost } from '../../card/Cost';

export class Scepter extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Scepter'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+$2', async () => {
          await ie.addCoins(2);
        }),
      )
      .from(
        new ActionChoice("Replay a non-Command Action card you played this turn that's still in play", async () => {
          // Choose a non-Command Action card still in play.
          const cardToReplay: Card | Choice = await ie
            .chooseCard('Choose a non-Command Action card in play to replay')
            .from(CardLocation.IN_PLAY)
            .to(CardSelectionPurpose.OTHER)
            .whereCardIs(isActionCard) // Command filtering not yet implemented; stub
            .allowNoneOption()
            .choose();
          if (cardToReplay instanceof Card) {
            // stub: replayCardInPlay calls card.play() without moving the card
            await ie.replayCardInPlay(cardToReplay);
          }
        }),
      )
      .choose();
  }
}
