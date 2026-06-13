import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { isActionCard } from '../../StandardCardEligibilityFunctions';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class WitchsHut extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("Witch's Hut"));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(4);

    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Choose 2 cards to discard')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(2))
      .choose();

    await ie.revealCards(cardsToDiscard);
    await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);

    if (cardsToDiscard.size() === 2 && cardsToDiscard.numMatchingCards(isActionCard) === 2) {
      await ie.performAttack(this, this.attack.bind(this));
    }
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().gainCardFromPile('Curse');
  }
}
