import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isCurseCard } from '../../StandardCardEligibilityFunctions';

export class OldWitch extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Old Witch'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    await ie.gainFromPile('Curse');
    // Defender may trash a Curse from hand.
    const curseToTrash: Card | Choice = await ie
      .chooseCard('You may trash a Curse from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(isCurseCard)
      .allowNoneOption()
      .choose();
    if (curseToTrash instanceof Card) {
      await ie.trashCardFromLocation(curseToTrash, CardLocation.HAND);
    }
  }
}
