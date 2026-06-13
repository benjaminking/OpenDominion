import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsExactlyNLessThanCard, costsExactlyNMoreThanCard, either } from '../../StandardCardEligibilityFunctions';

export class Develop extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Develop'));
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
    if (trashedCard === undefined) {
      return;
    }

    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a card costing either $1 more or $1 less than the trashed card to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(either(costsExactlyNLessThanCard(trashedCard, 1), costsExactlyNMoreThanCard(trashedCard, 1)))
      .allowNoneOption()
      .choose();

    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain, CardLocation.DECK);

      const otherCost = costsExactlyNMoreThanCard(trashedCard, 1).matches(cardToGain)
        ? trashedCard.getCost().plus(1)
        : trashedCard.getCost().minus(1);
      const otherCardEligibilityFunction = costsExactlyNMoreThanCard(trashedCard, 1).matches(cardToGain)
        ? costsExactlyNLessThanCard(trashedCard, 1)
        : costsExactlyNMoreThanCard(trashedCard, 1);
      const otherCardToGain: Card | Choice = await ie
        .chooseCard('Choose a card costing exactly ' + otherCost.toString() + ' to gain')
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(otherCardEligibilityFunction)
        .allowNoneOption()
        .choose();

      if (otherCardToGain instanceof Card) {
        await ie.gainCardFromPile(otherCardToGain, CardLocation.DECK);
      }
    }
  }
}
