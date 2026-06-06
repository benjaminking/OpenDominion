import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Cutpurse extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cutpurse'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    const coppersInHand: CardCollection = ie.getMatchingCardsInHand(cardNameIs('copper'));
    if (coppersInHand.size() > 0) {
      await ie.discardCardFromLocation(coppersInHand.getArbitraryCard(), CardLocation.HAND);
    } else {
      await ie.revealHand();
    }
  }
}
