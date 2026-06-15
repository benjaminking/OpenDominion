import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class ScryingPool extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Scrying Pool'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    await this.revealTopCardChoice(ie.getSharedGameState().getCurrentPlayer(), ie);
    await ie.performAttack(this, this.attack.bind(this));

    const actions = await ie.revealUntil(isActionCard, Infinity);
    ie.putCardsIntoHandFromLocation(actions, CardLocation.REVEAL_LIMBO);
  }

  public async attack(attackedPlayer: Player, attackingPlayer: Player): Promise<void> {
    await this.revealTopCardChoice(attackedPlayer, attackingPlayer.getInstructionExecutor());
  }

  private async revealTopCardChoice(targetPlayer: Player, chooserIe: InstructionExecutor): Promise<void> {
    const targetIe = targetPlayer.getInstructionExecutor();
    const topCard: Card | undefined = await targetIe.lookAtTopCardOfDeck();
    if (topCard === undefined) {
      return;
    }

    await targetIe.revealCard(topCard);
    await chooserIe
      .chooseOneOption('Choose what happens to ' + targetPlayer.getName() + "'s " + topCard.getName())
      .from(
        new ActionChoice('Discard it', async () => {
          await targetIe.discardCardFromLocation(topCard, CardLocation.DECK);
        }),
      )
      .from(new ActionChoice('Put it back'))
      .choose();
  }
}
