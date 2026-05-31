import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

// Dismantle: Trash a card from your hand. If it costs $1 or more, gain a cheaper card and a Gold.
export class Dismantle extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Dismantle'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }
    const trashedCard = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashedCard === undefined || trashedCard.getCost().coins < 1) {
      return;
    }
    const cheaperCard: Card | Choice = await ie
      .chooseCard(`Gain a card costing less than $${trashedCard.getCost().coins}`)
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(trashedCard.getCost().plus(-1)))
      .choose();
    if (cheaperCard instanceof Card) {
      await ie.gainCardFromPile(cheaperCard);
    }
    await ie.gainFromPile('Gold');
  }
}
