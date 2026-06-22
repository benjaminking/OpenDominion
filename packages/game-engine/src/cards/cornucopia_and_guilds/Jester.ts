import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Jester extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Jester'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, attackingPlayer: Player): Promise<void> {
    const attackingIe: InstructionExecutor = attackingPlayer.getInstructionExecutor();
    const attackedIe: InstructionExecutor = attackedPlayer.getInstructionExecutor();

    const discardedCard = await attackedIe.discardTopCardOfDeck();
    if (discardedCard === undefined) {
      return;
    }

    if (isVictoryCard.matches(discardedCard)) {
      await attackedIe.gainFromPile('curse');
    } else {
      await attackingIe
        .chooseOneOption(
          'Jester: who should gain a copy of ' + discardedCard.getName() + '?',
        )
        .from(
          new ActionChoice('You gain a copy', async () => {
            await attackingIe.gainFromPile(discardedCard.getName());
          }),
        )
        .from(
          new ActionChoice(attackedPlayer.getName() + ' gains a copy', async () => {
            await attackedIe.gainFromPile(discardedCard.getName());
          }),
        )
        .choose();
    }
  }
}
