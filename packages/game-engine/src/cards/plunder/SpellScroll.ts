import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsLessThanCard, either, isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class SpellScroll extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Spell Scroll'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const trashedCard = await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
    if (!(trashedCard instanceof Card)) {
      return;
    }

    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a cheaper card to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsLessThanCard(this))
      .choose();
    if (!(cardToGain instanceof Card)) {
      return;
    }

    const gainedCard = await ie.gainCardFromPile(cardToGain);
    if (gainedCard instanceof Card && either(isActionCard, isTreasureCard).matches(gainedCard)) {
      await ie.playCardFromLocation(gainedCard, gainedCard.getLocation());
    }
  }
}
