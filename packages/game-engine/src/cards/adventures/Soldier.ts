import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { isAttackCard } from '../../StandardCardEligibilityFunctions';

export class Soldier extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Soldier'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    // +$1 per other Attack in play (not counting self)
    const attacksInPlay = ie.numMatchingCardsPlayedThisTurn(isAttackCard);
    if (attacksInPlay > 1) {
      await ie.addCoins(attacksInPlay - 1);
    }

    // Attack: each other player with 4+ cards in hand discards a card
    await ie.performAttack(this, async (attackedPlayer: Player) => {
      const attackedIe = attackedPlayer.getInstructionExecutor();
      if (attackedIe.handSize() >= 4) {
        const cardToDiscard: Card | Choice = await attackedIe
          .chooseCard('Discard a card')
          .from(CardLocation.HAND)
          .to(CardSelectionPurpose.DISCARD)
          .choose();
        if (cardToDiscard instanceof Card) {
          await attackedIe.discardCardFromLocation(cardToDiscard, CardLocation.HAND);
        }
      }
    });
  }
}
