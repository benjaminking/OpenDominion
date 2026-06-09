import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Torturer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Torturer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    await ie
      .chooseOneOption('Discard 2 cards or gain a Curse to your hand?')
      .from(
        new ActionChoice('Discard 2 cards', async () => {
          const cards = await ie
            .chooseCards('Choose 2 cards to discard')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.DISCARD)
            .whereNumCardsIs(exactlyNChecked(2))
            .choose();
          await ie.discardCardsFromLocation(cards, CardLocation.HAND);
        }),
      )
      .from(
        new ActionChoice('Gain a Curse to your hand', async () => await ie.gainFromPile('curse', CardLocation.HAND)),
      )
      .choose();
  }
}
