import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class MountainVillage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mountain Village'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);

    // Look through discard and put a card in hand; if can't, +1 Card.
    const discardSize = ie.getDiscardPileSize();
    if (discardSize === 0) {
      await ie.drawCards(1);
      return;
    }

    const cardChoice: Card | Choice = await ie
      .chooseCard('Choose a card from your discard pile to put into your hand')
      .from(CardLocation.DISCARD)
      .to(CardSelectionPurpose.OTHER)
      .allowNoneOption()
      .choose();
    if (cardChoice instanceof Card) {
      ie.putCardIntoHandFromLocation(cardChoice, CardLocation.DISCARD);
    } else {
      await ie.drawCards(1);
    }
  }
}
