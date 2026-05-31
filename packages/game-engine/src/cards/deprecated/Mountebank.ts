import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

// Mountebank (Action/Attack): +$2. Each other player may discard a Curse.
// If they don't, they gain a Curse and a Copper.
export class Mountebank extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mountebank'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    const hasCurse = attackedIe.hasMatchingCardInHand(cardNameIs('Curse'));
    if (hasCurse) {
      let discarded = false;
      await attackedIe
        .chooseOneOption('You may discard a Curse')
        .from(
          new ActionChoice('Discard Curse', async () => {
            const curse = attackedPlayer.getOwnedCards().getMatchingCardsInHand(cardNameIs('Curse')).getArbitraryCard();
            await attackedIe.discardCardFromLocation(curse, curse.getLocation());
            discarded = true;
          }),
        )
        .from(new ActionChoice('Keep Curse (gain Curse + Copper)'))
        .choose();
      if (discarded) {
        return;
      }
    }
    await attackedIe.gainCardFromPile('Curse');
    await attackedIe.gainCardFromPile('Copper');
  }
}
