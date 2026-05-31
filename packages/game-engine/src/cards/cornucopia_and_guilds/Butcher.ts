import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyCard, costsUpTo } from '../../StandardCardEligibilityFunctions';
import { Cost } from '../../card/Cost';

// Butcher: +2 Coffers; you may trash a card from your hand and gain a card
// costing up to $1 more than it per Coffers you spend.
export class Butcher extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Butcher'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // TODO: addCoffers stub
    ie.addCoffers(2);

    const cardToTrash: Card | Choice = await ie
      .chooseCard('You may trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(anyCard)
      .allowNoneOption()
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }
    const trashedCost = cardToTrash.getCost();
    await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);

    // TODO: spendCoffers stub - player should choose how many coffers to spend
    // For now, spend all available Coffers (getCoffers() returns 0 while stub)
    const coffersToSpend = ie.getCoffers();
    await ie.spendCoffers(coffersToSpend);

    const gainLimit = Cost.Simple(trashedCost.coins + 1 + coffersToSpend);
    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain a card costing up to $' + gainLimit.coins.toFixed())
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(gainLimit))
      .allowNoneOption()
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
