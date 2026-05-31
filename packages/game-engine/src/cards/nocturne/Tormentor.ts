import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { anyCard } from '../../StandardCardEligibilityFunctions';

// Tormentor (Action/Attack/Doom): +$2.
// If you have no other cards in play, gain an Imp.
// Otherwise, each other player receives the next Hex.
export class Tormentor extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tormentor'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    const cardsInPlay = ie.numMatchingCardsInPlay(anyCard);
    if (cardsInPlay === 1) {
      await ie.gainFromSpiritPile('Imp');
    } else {
      await ie.performAttack(this, this.hexAttack.bind(this));
    }
  }

  public async hexAttack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    await attackedIe.receiveNextHex();
  }
}
