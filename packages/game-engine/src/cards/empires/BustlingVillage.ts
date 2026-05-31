import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class BustlingVillage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bustling Village'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(3);
    const cardToReveal: Card | Choice = await ie
      .chooseCard('You may reveal a Settlers from your discard pile to put into your hand')
      .from(CardLocation.DISCARD)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(cardNameIs('Settlers'))
      .allowNoneOption()
      .choose();
    if (cardToReveal instanceof Card) {
      await ie.revealCard(cardToReveal);
      ie.putCardIntoHandFromLocation(cardToReveal, CardLocation.DISCARD);
    }
  }
}
