import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { anyCard } from '../../StandardCardEligibilityFunctions';

export class Pillage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pillage'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // e.g. a Throne Room's second play: it already trashed itself, so it has lost track of itself
    const locationExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
    if (!locationExpectation.isMet(this)) {
      ie.sendLostTrackMessage(this);
      return;
    }
    const trashed = await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
    if (trashed !== undefined) {
      await ie.gainFromPile('Spoils');
      await ie.gainFromPile('Spoils');
      await ie.performAttack(this, this.attack.bind(this));
    }
  }

  private async attack(attackedPlayer: Player, attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    const attackingIe = attackingPlayer.getInstructionExecutor();

    const handSize = attackedIe.handSize();
    if (handSize >= 5) {
      await attackedIe.revealHand();
      // Attacking player chooses a card from attacked player's hand to discard
      const hand: CardCollection = attackedIe.getMatchingCardsInHand(anyCard);
      const cardToDiscard: Card | Choice = await attackingIe
        .chooseCard("Choose a card from opponent's hand to discard")
        .from(hand)
        .to(CardSelectionPurpose.DISCARD)
        .choose();
      if (cardToDiscard instanceof Card) {
        await attackedIe.discardCardFromLocation(cardToDiscard, CardLocation.HAND);
      }
    }
  }
}
