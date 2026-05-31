import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { costsAtLeast } from '../../StandardCardEligibilityFunctions';

export class Villain extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Villain'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoffers(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    if (ie.handSize() < 5) {
      return;
    }
    // Defender with 5+ cards discards a card costing $2+ or reveals they can't.
    const cardToDiscard: Card | Choice = await ie
      .chooseCard('Discard a card costing $2 or more (or reveal you have none)')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(costsAtLeast(Cost.Simple(2)))
      .allowNoneOption()
      .choose();
    if (cardToDiscard instanceof Card) {
      await ie.discardCardFromLocation(cardToDiscard, CardLocation.HAND);
    } else {
      // Reveal hand to show inability to comply.
      await ie.revealHand();
    }
  }
}
