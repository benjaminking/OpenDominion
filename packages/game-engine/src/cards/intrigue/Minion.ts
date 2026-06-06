import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';

export class Minion extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Minion'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+$2', async () => {
          await ie.addCoins(2);
        }),
      )
      .from(
        new ActionChoice('Discard hand and draw 4 cards', async () => {
          await ie.discardHand();
          await ie.drawCards(4);
          await ie.performAttack(this, this.discardAttack.bind(this));
        }),
      )
      .choose();
  }

  public async discardAttack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    if (ie.handSize() >= 5) {
      await ie.discardHand();
      await ie.drawCards(4);
    }
  }
}
