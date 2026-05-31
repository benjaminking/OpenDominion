import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isVictoryCard } from '../../StandardCardEligibilityFunctions';
import { Cost } from '../../card/Cost';

// Horn of Plenty: Treasure. Worth $0.
// When you play this, gain a card costing up to $1 per differently named card
// you have in play (including this). If it's a Victory card, trash this.
export class HornOfPlenty extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Horn of Plenty'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Count unique card names in play (including this card, already in play)
    const inPlay = ie.getSharedGameState().getCurrentPlayer().getOwnedCards().getInPlay();
    const uniqueNames = inPlay.cardGroups().length;
    const gainLimit = Cost.Simple(uniqueNames);

    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain a card costing up to $' + uniqueNames.toFixed())
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(gainLimit))
      .allowNoneOption()
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
      if (isVictoryCard.matches(cardToGain)) {
        await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
      }
    }
  }
}
