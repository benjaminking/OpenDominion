import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsExactly } from '../../StandardCardEligibilityFunctions';

export class Forge extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Forge'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardsToTrash: CardCollection = await ie
      .chooseCards('Choose any number of cards to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();

    let totalCoins = 0;
    for (const card of cardsToTrash) {
      totalCoins += card.getCost().coins;
    }

    await ie.trashCardsFromLocation(cardsToTrash, CardLocation.HAND);

    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a card costing exactly $' + totalCoins.toFixed() + ' to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsExactly(Cost.Simple(totalCoins)))
      .choose();

    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
