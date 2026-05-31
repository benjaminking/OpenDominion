import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

// Loan (Treasure): $1. When you play this, reveal cards from your deck until you reveal a Treasure.
// Discard or trash that Treasure; discard the rest.
export class Loan extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Loan'));
    this.setCoins(1);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    const discardPile = new CardCollection();
    let foundTreasure = undefined;
    while (foundTreasure === undefined) {
      const card = await ie.takeCardOffDeck();
      if (card === undefined) {
        break;
      }
      if (isTreasureCard.matches(card)) {
        foundTreasure = card;
      } else {
        discardPile.addCard(card);
      }
    }
    if (discardPile.size() > 0) {
      await ie.discardCards(discardPile, CardLocation.REVEAL_LIMBO);
    }
    if (foundTreasure === undefined) {
      return;
    }
    const treasure = foundTreasure;
    await ie
      .chooseOneOption(`${treasure.getName()}: discard or trash?`)
      .from(
        new ActionChoice('Discard', async () => {
          await ie.discardCards(new CardCollection(treasure), CardLocation.REVEAL_LIMBO);
        }),
      )
      .from(
        new ActionChoice('Trash', async () => {
          await ie.trashCardFromSet(treasure, new CardCollection(treasure));
        }),
      )
      .choose();
  }
}
