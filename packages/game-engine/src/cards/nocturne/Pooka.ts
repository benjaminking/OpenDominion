import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, CardType, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

const isTrashableTreasure = new CardEligibilityFunction(
  (c: Card) => isTreasureCard.matches(c) && c.getName() !== 'Cursed Gold',
);

// Pooka: You may trash a Treasure other than Cursed Gold from your hand, for +4 Cards.
export class Pooka extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pooka'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToTrash: Card | Choice = await ie
      .chooseCard('You may trash a Treasure (not Cursed Gold) from your hand for +4 Cards')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(isTrashableTreasure)
      .allowNoneOption()
      .choose();
    if (cardToTrash instanceof Card) {
      await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
      await ie.drawCards(4);
    }
  }
}
