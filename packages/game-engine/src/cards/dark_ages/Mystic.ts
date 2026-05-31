import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyCard } from '../../StandardCardEligibilityFunctions';

export class Mystic extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mystic'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    await ie.addCoins(2);

    // Name a card
    const namedCard: Card | Choice = await ie
      .chooseCard('Name a card')
      .from(CardSelectionLocation.ALL_CARDS)
      .to(CardSelectionPurpose.OTHER)
      .whereCardIs(anyCard)
      .choose();

    const topCard = await ie.lookAtTopCardOfDeck();
    if (topCard === undefined) {
      return;
    }

    await ie.revealCard(topCard);
    if (namedCard instanceof Card && topCard.getName() === namedCard.getName()) {
      await ie.putTopCardOfDeckIntoHand();
    } else {
      ie.putCardOnDeck(topCard);
    }
  }
}
