import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardType } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Magpie extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Magpie'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const topCard = await ie.lookAtTopCardOfDeck();
    if (topCard !== undefined) {
      await ie.revealCard(topCard);
      if (topCard.getTypes().has(CardType.TREASURE)) {
        ie.putCardIntoHandFromLocation(topCard, CardLocation.DECK);
      } else if (topCard.getTypes().has(CardType.ACTION) || topCard.getTypes().has(CardType.VICTORY)) {
        await ie.gainCardFromPile('Magpie');
      }
    }
  }
}
