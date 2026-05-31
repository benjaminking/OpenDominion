import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

// Young Witch: +2 Cards, discard 2 cards. Each other player gains a Curse
// unless they reveal a Bane card from their hand.
// Setup: Add an extra Kingdom card pile costing $2 or $3 — its cards are Banes.
// Note: Bane card identification is a stub (no Bane tracking in engine yet).
export class YoungWitch extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Young Witch'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);

    const toDiscard: CardCollection = await ie
      .chooseCards('Discard 2 cards')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(2))
      .choose();
    await ie.discardCardsFromLocation(toDiscard, CardLocation.HAND);

    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe: InstructionExecutor = attackedPlayer.getInstructionExecutor();
    // TODO: allow the attacked player to reveal a Bane card from their hand
    // to block this attack (requires Bane pile tracking in the engine).
    await attackedIe.gainFromPile('curse');
  }
}
