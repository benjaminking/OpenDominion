import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

// Idol (Treasure/Attack/Fate): $2.
// If you have an odd number of Idols in play (counting this), receive a Boon.
// Otherwise, each other player gains a Curse.
export class Idol extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Idol'));
    this.setCoins(2);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    const idolsInPlay = ie.numMatchingCardsInPlay(cardNameIs('Idol'));
    if (idolsInPlay % 2 === 1) {
      await ie.receiveBoon();
    } else {
      await ie.performAttack(this, this.curseAttack.bind(this));
    }
  }

  public async curseAttack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    await ie.gainCardFromPile('Curse');
  }
}
