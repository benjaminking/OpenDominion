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
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Artificer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Artificer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.addCoins(1);

    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Discard any number of cards')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(upToNChecked(ie.handSize()))
      .choose();
    await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);

    const numDiscarded = cardsToDiscard.size();
    if (numDiscarded > 0) {
      const cardToGain: Card | Choice = await ie
        .chooseCard('You may gain a card costing exactly $' + numDiscarded)
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsExactly(Cost.Simple(numDiscarded)))
        .allowNoneOption()
        .choose();
      if (cardToGain instanceof Card) {
        await ie.gainCardFromPile(cardToGain, CardLocation.DECK);
      }
    }
  }
}
