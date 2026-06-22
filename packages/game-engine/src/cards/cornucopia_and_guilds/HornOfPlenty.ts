import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard, costsUpTo, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class HornOfPlenty extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Horn of Plenty'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const gainLimit = ie.numUniqueMatchingCardsInPlay(anyCard);

    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain a card costing up to $' + gainLimit.toFixed())
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(gainLimit)))
      .choose();
    if (cardToGain instanceof Card) {
      const gainedCard = await ie.gainCardFromPile(cardToGain);
      if (gainedCard !== undefined && isVictoryCard.matches(gainedCard)) {
        await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
      }
    }
  }
}
