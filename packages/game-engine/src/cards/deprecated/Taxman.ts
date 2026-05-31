import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isTreasureCard } from '../../StandardCardEligibilityFunctions';

// Taxman (Action/Attack): You may trash a Treasure from your hand.
// Each other player with 5+ cards discards a copy of it (or reveals they can't).
// Gain a Treasure costing up to $3 more than the trashed card, onto your deck.
export class Taxman extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Taxman'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const chosen: Card | Choice = await ie
      .chooseCard('Trash a Treasure from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();
    if (!(chosen instanceof Card)) {
      return;
    }
    const trashedCost = chosen.getCost();
    await ie.trashCardFromLocation(chosen, CardLocation.HAND);
    await ie.performAttack(this, this.attack.bind(this, chosen.getName()));
    const toGain: Card | Choice = await ie
      .chooseCard('Gain a Treasure costing up to $3 more than the trashed card')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(isTreasureCard)
      .whereCardIs(costsUpTo(trashedCost.plus(3)))
      .choose();
    if (toGain instanceof Card) {
      await ie.gainCardFromPile(toGain, CardLocation.DECK);
    }
  }

  private async attack(trashedName: string, attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    if (attackedPlayer.getOwnedCards().getHand().size() < 5) {
      return;
    }
    const matching = attackedPlayer
      .getOwnedCards()
      .getHand()
      .getMatchingCards(new CardEligibilityFunction((c: Card) => c.getName() === trashedName));
    if (matching.size() > 0) {
      const copy: Card | Choice = await attackedIe
        .chooseCard(`Discard a ${trashedName}`)
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.DISCARD)
        .whereCardIs(new CardEligibilityFunction((c: Card) => c.getName() === trashedName))
        .choose();
      if (copy instanceof Card) {
        await attackedIe.discardCards(new CardCollection(copy), CardLocation.HAND);
      }
    }
  }
}
