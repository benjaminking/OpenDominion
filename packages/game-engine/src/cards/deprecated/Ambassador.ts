import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

// Ambassador (Action/Attack): Reveal a card from your hand. Return up to 2 copies of it from your hand to the supply.
// Each other player gains a copy of it.
export class Ambassador extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ambassador'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const chosen: Card | Choice = await ie
      .chooseCard('Reveal a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .choose();
    if (!(chosen instanceof Card)) {
      return;
    }
    await ie.revealCards(new CardCollection(chosen));
    const cardName = chosen.getName();
    const copies = ie.getMatchingCardsInHand(new CardEligibilityFunction((c: Card) => c.getName() === cardName));
    const numToReturn = Math.min(2, copies.size());
    let returnedCount = 0;
    if (numToReturn > 0) {
      const toReturn = await ie
        .chooseCards(`Return up to 2 ${cardName}(s) to the supply`)
        .from(copies)
        .to(CardSelectionPurpose.OTHER)
        .whereNumCardsIs(upToNChecked(numToReturn))
        .choose();
      for (const _card of toReturn) {
        // TODO: Return card to supply pile — supply return mechanic not implemented
        returnedCount++;
      }
    }
    await ie.performAttack(this, async (attackedPlayer: Player) => {
      await attackedPlayer.getInstructionExecutor().gainCardFromPile(cardName);
    });
  }
}
